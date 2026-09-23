-- Allow student accounts to turn in (and read their own) submissions.
-- Material submissions landed parent-only; student role can view materials but
-- failed begin_material_submission with "This material isn’t available."

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

revoke all on function private.family_can_access_submission(bigint, bigint)
  from public, anon;
grant execute on function private.family_can_access_submission(bigint, bigint)
  to authenticated, service_role;

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
      batch_id, material_id, student_profile_id, file_id, position, created_by
    ) values (
      batch, p_material_id, p_student_profile_id, file_id, ord, (select auth.uid())
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

drop policy if exists material_submissions_select on public.material_submissions;
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

drop policy if exists material_submission_versions_select on public.material_submission_versions;
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

drop policy if exists material_submission_files_select on public.material_submission_files;
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
