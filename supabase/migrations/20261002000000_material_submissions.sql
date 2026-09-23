-- Material submissions: families turn in one or more files, as many times
-- as the teacher allows. Due time is an instant; the calendar still uses due_date.

alter table public.materials
  add column accept_submissions boolean not null default false,
  add column allow_submissions_past_due boolean not null default true,
  add column submission_limit int not null default 2,
  add column submission_file_types text[] not null default '{}',
  add column due_at timestamptz,
  add column due_timezone text;

alter table public.materials
  add constraint materials_submission_limit_chk
    check (submission_limit between 1 and 10),
  add constraint materials_submission_types_chk
    check (
      submission_file_types <@ array['pdf', 'image', 'document', 'audio', 'video']::text[]
    ),
  add constraint materials_accept_types_chk
    check (not accept_submissions or cardinality(submission_file_types) > 0),
  add constraint materials_due_at_date_chk
    check (due_date is not null or due_at is null),
  add constraint materials_due_timezone_chk
    check (
      (due_at is null and due_timezone is null)
      or (
        due_at is not null
        and due_timezone is not null
        and char_length(due_timezone) between 1 and 100
      )
    );

comment on column public.materials.accept_submissions is
  'When true, a linked parent may turn in files for an enrolled student.';
comment on column public.materials.allow_submissions_past_due is
  'When false, turn-in stops after due_at. Default true. No effect when due_at is null.';
comment on column public.materials.submission_limit is
  'How many times one student may turn work in (1–10). Not a file count.';
comment on column public.materials.submission_file_types is
  'Allowed groups: pdf, image, document, audio, video. Required when accept_submissions.';
comment on column public.materials.due_at is
  'Due instant. Null on older rows until the due date is saved again. This week still uses due_date.';
comment on column public.materials.due_timezone is
  'IANA zone used to interpret the due time. Display the deadline in this zone.';

-- ---------------------------------------------------------------------------
-- Submissions
-- ---------------------------------------------------------------------------

create table public.material_submissions (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  course_id bigint not null references public.courses (id) on delete cascade,
  material_id bigint not null references public.materials (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index material_submissions_material_student_uidx
  on public.material_submissions (material_id, student_profile_id)
  where deleted_at is null;

create index material_submissions_material_id_idx
  on public.material_submissions (material_id)
  where deleted_at is null;
create index material_submissions_student_profile_id_idx
  on public.material_submissions (student_profile_id);
create index material_submissions_course_id_idx
  on public.material_submissions (course_id);

comment on table public.material_submissions is
  'One turn-in slot per student per material. Not a quiz Submission.';

create table public.material_submission_versions (
  id bigserial primary key,
  submission_id bigint not null references public.material_submissions (id) on delete cascade,
  version int not null,
  submitted_by uuid not null references public.profiles (id),
  submitted_at timestamptz not null default now(),
  constraint material_submission_versions_version_chk check (version >= 1),
  constraint material_submission_versions_submission_version_key unique (submission_id, version)
);

create index material_submission_versions_submission_id_idx
  on public.material_submission_versions (submission_id, version);
create index material_submission_versions_submitted_by_idx
  on public.material_submission_versions (submitted_by);

comment on table public.material_submission_versions is
  'One turn-in. submitted_at is when every file in the batch landed.';

create table public.material_submission_files (
  id bigserial primary key,
  submission_version_id bigint not null
    references public.material_submission_versions (id) on delete cascade,
  file_id bigint not null references public.files (id) on delete restrict,
  position int not null default 0,
  constraint material_submission_files_file_key unique (file_id),
  constraint material_submission_files_version_position_key
    unique (submission_version_id, position)
);

create index material_submission_files_version_id_idx
  on public.material_submission_files (submission_version_id, position);

comment on table public.material_submission_files is
  'Files in one turn-in. Each file is its own immutable files row.';

-- In-progress upload claim. Not a submission until finish. No client access.
create table public.material_submission_uploads (
  file_id bigint primary key references public.files (id) on delete cascade,
  batch_id text not null,
  material_id bigint not null references public.materials (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  position int not null,
  created_at timestamptz not null default now()
);

create index material_submission_uploads_batch_idx
  on public.material_submission_uploads (batch_id);

alter table public.material_submission_uploads enable row level security;
revoke all on public.material_submission_uploads from public, anon, authenticated;

comment on table public.material_submission_uploads is
  'Files reserved by begin_material_submission before the bytes land. Abandoned rows stay unreferenced.';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.submission_file_allowed(
  p_types text[],
  p_filename text,
  p_mime text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  ext text;
  mime text;
  kind text;
begin
  ext := lower(coalesce(substring(p_filename from '\.([^.]+)$'), ''));
  mime := lower(btrim(coalesce(p_mime, '')));
  if p_types is null then
    return false;
  end if;
  foreach kind in array p_types loop
    if kind = 'pdf' and (ext = 'pdf' or mime = 'application/pdf') then
      return true;
    elsif kind = 'image' and (
      ext in ('jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif')
      or mime in (
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'image/heic', 'image/heif', 'image/heic-sequence'
      )
    ) then
      return true;
    elsif kind = 'document' and (
      ext in ('doc', 'docx', 'txt', 'rtf', 'odt', 'pages')
      or mime in (
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
        'text/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.apple.pages'
      )
    ) then
      return true;
    elsif kind = 'audio' and (
      ext in ('mp3', 'm4a', 'wav', 'aac', 'ogg', 'oga', 'flac', 'webm')
      or mime like 'audio/%'
    ) then
      return true;
    elsif kind = 'video' and (
      ext in ('mp4', 'mov', 'webm', 'm4v', 'mkv', 'avi')
      or mime like 'video/%'
    ) then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

create or replace function private.safe_submission_filename(p_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  cleaned text;
begin
  cleaned := left(
    regexp_replace(btrim(coalesce(p_name, '')), '[/\\?%*:|"<>]', '-', 'g'),
    180
  );
  if cleaned is null or cleaned = '' then
    return 'file';
  end if;
  return cleaned;
end;
$$;

create or replace function private.submission_is_past_due(p_material public.materials)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not p_material.allow_submissions_past_due
    and p_material.due_at is not null
    and now() > p_material.due_at;
$$;

create or replace function private.family_can_access_submission(
  p_student_profile_id bigint,
  p_course_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      private.parent_linked_to_student(p_student_profile_id)
      and private.parent_can_view_course(p_course_id)
    )
    or (
      private.student_owns_profile(p_student_profile_id)
      and private.student_can_view_course(p_course_id)
    );
$$;

create or replace function private.parent_can_view_submission_file(p_file_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.material_submission_files msf
    join public.material_submission_versions v
      on v.id = msf.submission_version_id
    join public.material_submissions s
      on s.id = v.submission_id
    join public.materials m
      on m.id = s.material_id
    where msf.file_id = p_file_id
      and s.deleted_at is null
      and m.deleted_at is null
      and m.visibility = 'published'
      and m.course_id is not null
      and private.family_can_access_submission(s.student_profile_id, m.course_id)
  );
$$;

-- Path segment 2 is the file id. A non-numeric segment is not a submission object.
create or replace function private.submission_path_file_id(p_name text)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case
    when (string_to_array(p_name, '/'))[2] ~ '^[0-9]+$'
      then (string_to_array(p_name, '/'))[2]::bigint
    else null
  end;
$$;

-- Uploader may insert only the path begin reserved, and only before it is turned in.
-- Security definer so the check does not depend on the parent being able to select files.
create or replace function private.can_insert_submission_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.files f
    join public.material_submission_uploads u on u.file_id = f.id
    where f.id = private.submission_path_file_id(p_name)
      and f.storage_ref = p_name
      and f.uploaded_by = (select auth.uid())
      and f.deleted_at is null
      and not exists (
        select 1
        from public.material_submission_files msf
        where msf.file_id = f.id
      )
  );
$$;

create or replace function private.can_select_submission_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.submission_path_file_id(p_name) is not null
    and private.parent_can_view_submission_file(private.submission_path_file_id(p_name));
$$;

revoke all on function private.family_can_access_submission(bigint, bigint)
  from public, anon;
revoke all on function private.parent_can_view_submission_file(bigint) from public, anon;
revoke all on function private.can_insert_submission_object(text) from public, anon;
revoke all on function private.can_select_submission_object(text) from public, anon;
grant execute on function private.family_can_access_submission(bigint, bigint)
  to authenticated, service_role;
grant execute on function private.parent_can_view_submission_file(bigint)
  to authenticated, service_role;
grant execute on function private.can_insert_submission_object(text)
  to authenticated, service_role;
grant execute on function private.can_select_submission_object(text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Turn-in RPCs
-- ---------------------------------------------------------------------------

create or replace function public.begin_material_submission(
  p_material_id bigint,
  p_student_profile_id bigint,
  p_files jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  slot_id bigint;
  finished int;
  batch text;
  elem jsonb;
  ord int;
  filename text;
  mime text;
  size_bytes bigint;
  file_id bigint;
  next_ref text;
  result jsonb := '[]'::jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to turn this in.' using errcode = '42501';
  end if;

  select * into material
  from public.materials
  where id = p_material_id;

  if not found or material.deleted_at is not null or material.course_id is null then
    raise exception 'This material isn’t available.' using errcode = 'P0002';
  end if;

  if material.visibility <> 'published'
     or not (
       private.parent_can_view_course(material.course_id)
       or private.student_can_view_course(material.course_id)
     ) then
    raise exception 'This material isn’t available.' using errcode = '42501';
  end if;

  if not (
    private.parent_linked_to_student(p_student_profile_id)
    or private.student_owns_profile(p_student_profile_id)
  ) then
    raise exception 'You can’t turn this in for that student.' using errcode = '42501';
  end if;

  if not private.family_can_access_submission(p_student_profile_id, material.course_id) then
    raise exception 'You can’t turn this in for that student.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.enrollments e
    where e.course_id = material.course_id
      and e.student_profile_id = p_student_profile_id
      and e.status = 'active'
  ) then
    raise exception 'You can’t turn this in for that student.' using errcode = '42501';
  end if;

  if not material.accept_submissions then
    raise exception 'This material isn’t accepting submissions.' using errcode = 'P0001';
  end if;

  if private.submission_is_past_due(material) then
    raise exception 'The due date has passed, so this can no longer be turned in.'
      using errcode = 'P0001';
  end if;

  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) < 1 then
    raise exception 'Choose at least one file.' using errcode = 'P0001';
  end if;

  if jsonb_array_length(p_files) > 20 then
    raise exception 'Turn in up to 20 files at a time.' using errcode = 'P0001';
  end if;

  for elem in select value from jsonb_array_elements(p_files) loop
    filename := coalesce(elem->>'filename', '');
    mime := coalesce(nullif(elem->>'mime', ''), 'application/octet-stream');
    if not private.submission_file_allowed(material.submission_file_types, filename, mime) then
      raise exception 'This file isn’t one of the allowed types.' using errcode = 'P0001';
    end if;
    if coalesce(elem->>'size', '') !~ '^[0-9]+$' then
      raise exception 'That file is too large to turn in.' using errcode = 'P0001';
    end if;
    size_bytes := (elem->>'size')::bigint;
    if size_bytes > 536870912 then
      raise exception 'That file is too large to turn in.' using errcode = 'P0001';
    end if;
  end loop;

  select s.id into slot_id
  from public.material_submissions s
  where s.material_id = p_material_id
    and s.student_profile_id = p_student_profile_id
    and s.deleted_at is null
  for update;

  if slot_id is null then
    begin
      insert into public.material_submissions (
        organization_id, course_id, material_id, student_profile_id
      ) values (
        material.organization_id, material.course_id, material.id, p_student_profile_id
      )
      returning id into slot_id;
    exception
      when unique_violation then
        select s.id into slot_id
        from public.material_submissions s
        where s.material_id = p_material_id
          and s.student_profile_id = p_student_profile_id
          and s.deleted_at is null
        for update;
    end;
  end if;

  select count(*) into finished
  from public.material_submission_versions v
  where v.submission_id = slot_id;

  if finished >= material.submission_limit then
    raise exception 'No more versions can be turned in.' using errcode = 'P0001';
  end if;

  delete from public.material_submission_uploads u
  where u.material_id = p_material_id
    and u.student_profile_id = p_student_profile_id
    and u.created_by = (select auth.uid());

  batch := encode(extensions.gen_random_bytes(16), 'hex');
  ord := 0;

  for elem in select value from jsonb_array_elements(p_files) loop
    filename := private.safe_submission_filename(elem->>'filename');
    mime := coalesce(nullif(elem->>'mime', ''), 'application/octet-stream');
    size_bytes := coalesce((elem->>'size')::bigint, 0);

    insert into public.files (
      organization_id, filename, storage_ref, mime_type, size_bytes, uploaded_by
    ) values (
      material.organization_id,
      filename,
      material.organization_id::text || '/0/1/' || filename,
      mime,
      size_bytes,
      (select auth.uid())
    )
    returning id into file_id;

    next_ref := material.organization_id::text || '/' || file_id::text || '/1/' || filename;

    update public.files
    set storage_ref = next_ref
    where id = file_id;

    insert into public.material_submission_uploads (
      file_id, batch_id, material_id, student_profile_id, created_by, position
    ) values (
      file_id, batch, p_material_id, p_student_profile_id, (select auth.uid()), ord
    );

    result := result || jsonb_build_array(
      jsonb_build_object('fileId', file_id, 'storageRef', next_ref)
    );
    ord := ord + 1;
  end loop;

  return jsonb_build_object('files', result);
end;
$$;

create or replace function public.finish_material_submission(
  p_material_id bigint,
  p_student_profile_id bigint,
  p_file_ids bigint[]
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  slot_id bigint;
  finished int;
  batch text;
  expected int;
  next_version int;
  version_id bigint;
  missing int;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to turn this in.' using errcode = '42501';
  end if;

  if p_file_ids is null or cardinality(p_file_ids) < 1 then
    raise exception 'Choose at least one file.' using errcode = 'P0001';
  end if;

  select * into material
  from public.materials
  where id = p_material_id;

  if not found or material.deleted_at is not null or material.course_id is null then
    raise exception 'This material isn’t available.' using errcode = 'P0002';
  end if;

  if not material.accept_submissions then
    raise exception 'This material isn’t accepting submissions.' using errcode = 'P0001';
  end if;

  if private.submission_is_past_due(material) then
    raise exception 'The due date has passed, so this can no longer be turned in.'
      using errcode = 'P0001';
  end if;

  if not private.family_can_access_submission(p_student_profile_id, material.course_id) then
    raise exception 'You can’t turn this in for that student.' using errcode = '42501';
  end if;

  select u.batch_id into batch
  from public.material_submission_uploads u
  where u.file_id = p_file_ids[1]
    and u.material_id = p_material_id
    and u.student_profile_id = p_student_profile_id
    and u.created_by = (select auth.uid());

  if batch is null then
    raise exception 'That upload didn’t finish. Try turning it in again.'
      using errcode = 'P0001';
  end if;

  select count(*) into expected
  from public.material_submission_uploads u
  where u.batch_id = batch;

  if expected <> cardinality(p_file_ids)
     or exists (
       select 1
       from unnest(p_file_ids) as fid
       where not exists (
         select 1
         from public.material_submission_uploads u
         where u.file_id = fid
           and u.batch_id = batch
           and u.created_by = (select auth.uid())
       )
     ) then
    raise exception 'Turn in every file in this batch together.' using errcode = 'P0001';
  end if;

  select count(*) into missing
  from public.material_submission_uploads u
  join public.files f on f.id = u.file_id
  where u.batch_id = batch
    and not exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'org-files'
        and o.name = f.storage_ref
    );

  if missing > 0 then
    raise exception 'That upload didn’t finish. Try turning it in again.'
      using errcode = 'P0001';
  end if;

  select s.id into slot_id
  from public.material_submissions s
  where s.material_id = p_material_id
    and s.student_profile_id = p_student_profile_id
    and s.deleted_at is null
  for update;

  if slot_id is null then
    raise exception 'That upload didn’t finish. Try turning it in again.'
      using errcode = 'P0001';
  end if;

  select count(*) into finished
  from public.material_submission_versions v
  where v.submission_id = slot_id;

  if finished >= material.submission_limit then
    raise exception 'No more versions can be turned in.' using errcode = 'P0001';
  end if;

  next_version := finished + 1;

  insert into public.material_submission_versions (
    submission_id, version, submitted_by, submitted_at
  ) values (
    slot_id, next_version, (select auth.uid()), now()
  )
  returning id into version_id;

  insert into public.material_submission_files (submission_version_id, file_id, position)
  select version_id, u.file_id, u.position
  from public.material_submission_uploads u
  where u.batch_id = batch
  order by u.position;

  delete from public.material_submission_uploads u
  where u.batch_id = batch;

  return next_version;
end;
$$;

revoke all on function public.begin_material_submission(bigint, bigint, jsonb)
  from public, anon;
revoke all on function public.finish_material_submission(bigint, bigint, bigint[])
  from public, anon;
grant execute on function public.begin_material_submission(bigint, bigint, jsonb)
  to authenticated;
grant execute on function public.finish_material_submission(bigint, bigint, bigint[])
  to authenticated;

comment on function public.begin_material_submission(bigint, bigint, jsonb) is
  'Reserve file rows for one turn-in. Does not record the submission until finish.';
comment on function public.finish_material_submission(bigint, bigint, bigint[]) is
  'Record one submission after every file in the batch is in Storage.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.material_submissions enable row level security;
alter table public.material_submission_versions enable row level security;
alter table public.material_submission_files enable row level security;

create policy material_submissions_select on public.material_submissions
for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.materials m
    where m.id = material_id
      and m.deleted_at is null
      and (
        (m.course_id is not null and (select private.can_manage_course(m.course_id)))
        or (
          m.visibility = 'published'
          and m.course_id is not null
          and (select private.family_can_access_submission(student_profile_id, m.course_id))
        )
      )
  )
);

create policy material_submission_versions_select on public.material_submission_versions
for select to authenticated
using (
  exists (
    select 1
    from public.material_submissions s
    where s.id = submission_id
      and s.deleted_at is null
      and exists (
        select 1
        from public.materials m
        where m.id = s.material_id
          and m.deleted_at is null
          and (
            (m.course_id is not null and (select private.can_manage_course(m.course_id)))
            or (
              m.visibility = 'published'
              and m.course_id is not null
              and (
                select private.family_can_access_submission(
                  s.student_profile_id,
                  m.course_id
                )
              )
            )
          )
      )
  )
);

create policy material_submission_files_select on public.material_submission_files
for select to authenticated
using (
  exists (
    select 1
    from public.material_submission_versions v
    join public.material_submissions s on s.id = v.submission_id
    join public.materials m on m.id = s.material_id
    where v.id = submission_version_id
      and s.deleted_at is null
      and m.deleted_at is null
      and (
        (m.course_id is not null and (select private.can_manage_course(m.course_id)))
        or (
          m.visibility = 'published'
          and m.course_id is not null
          and (
            select private.family_can_access_submission(
              s.student_profile_id,
              m.course_id
            )
          )
        )
      )
  )
);

create policy files_select_submission on public.files
for select to authenticated
using ((select private.parent_can_view_submission_file(id)));

create policy org_files_select_submission on storage.objects
for select to authenticated
using (
  bucket_id = 'org-files'
  and (select private.can_select_submission_object(name))
);

create policy org_files_insert_submission on storage.objects
for insert to authenticated
with check (
  bucket_id = 'org-files'
  and (select private.can_insert_submission_object(name))
);

grant select on public.material_submissions to authenticated, service_role;
grant select on public.material_submission_versions to authenticated, service_role;
grant select on public.material_submission_files to authenticated, service_role;
grant select, insert, update, delete on public.material_submissions to service_role;
grant select, insert, update, delete on public.material_submission_versions to service_role;
grant select, insert, update, delete on public.material_submission_files to service_role;
grant select, insert, update, delete on public.material_submission_uploads to service_role;

grant usage, select on sequence public.material_submissions_id_seq to service_role;
grant usage, select on sequence public.material_submission_versions_id_seq to service_role;
grant usage, select on sequence public.material_submission_files_id_seq to service_role;

-- ---------------------------------------------------------------------------
-- save_material_page learns submission settings and the due instant
-- ---------------------------------------------------------------------------

create or replace function public.save_material_page(
  p_material_id bigint,
  p_placement jsonb default null,
  p_blocks jsonb default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  next_title text;
  next_description text;
  next_url text;
  next_scheduled date;
  next_due date;
  next_accept boolean;
  next_allow_past boolean;
  next_limit int;
  next_types text[];
  next_due_at timestamptz;
  next_due_tz text;
  placement_changed boolean := false;
  current_blocks jsonb;
  next_blocks jsonb;
  blocks_changed boolean := false;
  new_version int;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to save.' using errcode = '42501';
  end if;

  select * into material
  from public.materials
  where id = p_material_id;

  if not found then
    raise exception 'That material isn’t there.' using errcode = 'P0002';
  end if;

  if material.course_id is not null then
    if not private.can_manage_course(material.course_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  elsif material.template_id is not null then
    if not private.can_edit_template(material.template_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  else
    raise exception 'You can’t edit this material.' using errcode = '42501';
  end if;

  if p_placement is not null then
    next_title := coalesce(p_placement->>'title', material.title);
    next_description := coalesce(p_placement->>'description', material.description);
    if material.kind = 'link' then
      next_url := p_placement->>'url';
    else
      next_url := material.url;
    end if;
    if jsonb_exists(p_placement, 'scheduled_date') then
      next_scheduled := nullif(p_placement->>'scheduled_date', '')::date;
    else
      next_scheduled := material.scheduled_date;
    end if;
    if jsonb_exists(p_placement, 'due_date') then
      next_due := nullif(p_placement->>'due_date', '')::date;
    else
      next_due := material.due_date;
    end if;
    if jsonb_exists(p_placement, 'accept_submissions') then
      next_accept := coalesce((p_placement->>'accept_submissions')::boolean, false);
    else
      next_accept := material.accept_submissions;
    end if;
    if jsonb_exists(p_placement, 'allow_submissions_past_due') then
      next_allow_past := coalesce((p_placement->>'allow_submissions_past_due')::boolean, true);
    else
      next_allow_past := material.allow_submissions_past_due;
    end if;
    if jsonb_exists(p_placement, 'submission_limit') then
      next_limit := coalesce((p_placement->>'submission_limit')::int, material.submission_limit);
    else
      next_limit := material.submission_limit;
    end if;
    if jsonb_exists(p_placement, 'submission_file_types')
       and jsonb_typeof(p_placement->'submission_file_types') = 'array' then
      select coalesce(array_agg(value), '{}'::text[])
      into next_types
      from jsonb_array_elements_text(p_placement->'submission_file_types') as value;
    else
      next_types := material.submission_file_types;
    end if;
    if next_due is null then
      next_due_at := null;
      next_due_tz := null;
    else
      if jsonb_exists(p_placement, 'due_at') then
        next_due_at := nullif(p_placement->>'due_at', '')::timestamptz;
      else
        next_due_at := material.due_at;
      end if;
      if jsonb_exists(p_placement, 'due_timezone') then
        next_due_tz := nullif(p_placement->>'due_timezone', '');
      else
        next_due_tz := material.due_timezone;
      end if;
    end if;

    if next_accept and coalesce(cardinality(next_types), 0) = 0 then
      raise exception 'Choose at least one kind of file families can turn in.'
        using errcode = '23514';
    end if;
    if next_limit < 1 or next_limit > 10 then
      raise exception 'Submissions allowed must be from 1 to 10.'
        using errcode = '23514';
    end if;
    if exists (
      select 1
      from unnest(coalesce(next_types, '{}'::text[])) as kind
      where kind not in ('pdf', 'image', 'document', 'audio', 'video')
    ) then
      raise exception 'That file type isn’t one families can turn in.'
        using errcode = '23514';
    end if;
    if next_due_at is not null and next_due_tz is null then
      raise exception 'Choose a timezone for the due time.'
        using errcode = '23514';
    end if;

    placement_changed :=
      next_title is distinct from material.title
      or next_description is distinct from material.description
      or next_url is distinct from material.url
      or next_scheduled is distinct from material.scheduled_date
      or next_due is distinct from material.due_date
      or next_accept is distinct from material.accept_submissions
      or next_allow_past is distinct from material.allow_submissions_past_due
      or next_limit is distinct from material.submission_limit
      or next_types is distinct from material.submission_file_types
      or next_due_at is distinct from material.due_at
      or next_due_tz is distinct from material.due_timezone;
  end if;

  if p_blocks is not null then
    if material.kind <> 'page' then
      raise exception 'Only page materials have lesson content.' using errcode = 'P0001';
    end if;
    if jsonb_typeof(p_blocks) <> 'array' then
      raise exception 'Page content is not in a shape we can save.' using errcode = 'P0001';
    end if;

    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'kind', b.kind,
            'body', b.body,
            'position', b.position,
            'file_id', b.file_id
          )
          order by b.position, b.id
        )
        from public.blocks b
        where b.material_id = p_material_id
          and b.deleted_at is null
      ),
      '[]'::jsonb
    )
    into current_blocks;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'kind', elem->>'kind',
          'body', coalesce(elem->'body', '{}'::jsonb),
          'position', coalesce((elem->>'position')::int, (ord - 1)::int),
          'file_id', case
            when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
            else null
          end
        )
        order by coalesce((elem->>'position')::int, (ord - 1)::int), ord
      ),
      '[]'::jsonb
    )
    into next_blocks
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);

    if exists (
      select 1
      from jsonb_array_elements(p_blocks) as elem
      where coalesce(elem->>'kind', '') not in ('rich_text', 'video')
    ) then
      raise exception 'That block type isn’t supported yet.' using errcode = 'P0001';
    end if;

    blocks_changed := current_blocks is distinct from next_blocks;
  end if;

  if not placement_changed and not blocks_changed then
    return material.current_version;
  end if;

  perform set_config('coursewright.skip_version', 'on', true);

  if placement_changed then
    update public.materials
    set
      title = next_title,
      description = next_description,
      url = next_url,
      scheduled_date = next_scheduled,
      due_date = next_due,
      accept_submissions = next_accept,
      allow_submissions_past_due = next_allow_past,
      submission_limit = next_limit,
      submission_file_types = coalesce(next_types, '{}'::text[]),
      due_at = next_due_at,
      due_timezone = next_due_tz
    where id = p_material_id;
  end if;

  if blocks_changed then
    update public.blocks
    set deleted_at = now()
    where material_id = p_material_id
      and deleted_at is null;

    insert into public.blocks (material_id, kind, body, position, file_id)
    select
      p_material_id,
      elem->>'kind',
      coalesce(elem->'body', '{}'::jsonb),
      coalesce((elem->>'position')::int, (ord - 1)::int),
      case
        when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
        else null
      end
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);
  end if;

  update public.materials m
  set current_version = m.current_version + 1
  where m.id = p_material_id
  returning m.current_version into new_version;

  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    p_material_id,
    new_version,
    private.material_page_snapshot(p_material_id),
    (select auth.uid()),
    'update'
  );

  return new_version;
end;
$$;
