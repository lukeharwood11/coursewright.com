-- P1 discussions: one course or one class; posts; one-level replies; attachments; answered; realtime.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.discussions (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  audience text not null,
  course_id bigint references public.courses (id) on delete cascade,
  class_id bigint references public.classes (id) on delete cascade,
  title text not null,
  created_by uuid not null references public.profiles (id),
  last_message_at timestamptz not null default now(),
  answered_at timestamptz,
  answered_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint discussions_title_chk check (char_length(btrim(title)) > 0),
  constraint discussions_audience_chk check (audience in ('course', 'class')),
  constraint discussions_audience_target_chk check (
    (
      audience = 'course'
      and course_id is not null
      and class_id is null
    )
    or (
      audience = 'class'
      and class_id is not null
      and course_id is null
    )
  ),
  constraint discussions_answered_chk check (
    (answered_at is null and answered_by is null)
    or (answered_at is not null and answered_by is not null)
  )
);

create index discussions_organization_id_idx
  on public.discussions (organization_id, last_message_at desc)
  where deleted_at is null;
create index discussions_course_id_idx
  on public.discussions (course_id)
  where deleted_at is null and audience = 'course';
create index discussions_class_id_idx
  on public.discussions (class_id)
  where deleted_at is null and audience = 'class';
create index discussions_created_by_idx on public.discussions (created_by);

create trigger discussions_set_updated_at
before update on public.discussions
for each row execute function private.set_updated_at();

comment on table public.discussions is
  'SCHEMA.md Discussion — two-way thread for one course or one class';

create table public.discussion_messages (
  id bigserial primary key,
  discussion_id bigint not null references public.discussions (id) on delete cascade,
  parent_id bigint references public.discussion_messages (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id)
);

create index discussion_messages_discussion_id_idx
  on public.discussion_messages (discussion_id, created_at, id);
create index discussion_messages_parent_id_idx
  on public.discussion_messages (parent_id)
  where parent_id is not null;
create index discussion_messages_author_id_idx
  on public.discussion_messages (author_id);

create trigger discussion_messages_set_updated_at
before update on public.discussion_messages
for each row execute function private.set_updated_at();

comment on table public.discussion_messages is
  'SCHEMA.md DiscussionMessage — post or one-level reply';

create table public.discussion_message_attachments (
  id bigserial primary key,
  message_id bigint not null references public.discussion_messages (id) on delete cascade,
  kind text not null,
  file_id bigint references public.files (id) on delete cascade,
  material_id bigint references public.materials (id) on delete cascade,
  url text,
  label text not null default '',
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint discussion_message_attachments_kind_chk
    check (kind in ('file', 'material', 'url')),
  constraint discussion_message_attachments_payload_chk check (
    (
      kind = 'file'
      and file_id is not null
      and material_id is null
      and url is null
    )
    or (
      kind = 'material'
      and material_id is not null
      and file_id is null
      and url is null
    )
    or (
      kind = 'url'
      and char_length(btrim(coalesce(url, ''))) > 0
      and file_id is null
      and material_id is null
    )
  )
);

create index discussion_message_attachments_message_id_idx
  on public.discussion_message_attachments (message_id, position, id);
create index discussion_message_attachments_file_id_idx
  on public.discussion_message_attachments (file_id)
  where file_id is not null;
create index discussion_message_attachments_material_id_idx
  on public.discussion_message_attachments (material_id)
  where material_id is not null;

comment on table public.discussion_message_attachments is
  'SCHEMA.md DiscussionMessageAttachment — file / material / url on a message';

create table public.discussion_reads (
  id bigserial primary key,
  discussion_id bigint not null references public.discussions (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  last_read_at timestamptz not null default now(),
  constraint discussion_reads_discussion_user_key unique (discussion_id, user_id)
);

create index discussion_reads_user_id_idx on public.discussion_reads (user_id);
create index discussion_reads_discussion_id_idx on public.discussion_reads (discussion_id);

comment on table public.discussion_reads is
  'SCHEMA.md DiscussionRead — per-user last read for unread badge';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function private.discussion_target_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.audience = 'course' then
    select c.organization_id into target_org
    from public.courses c
    where c.id = new.course_id;
  else
    select c.organization_id into target_org
    from public.classes c
    where c.id = new.class_id
      and c.deleted_at is null;
  end if;

  if target_org is null or target_org is distinct from new.organization_id then
    raise exception 'That course or class needs to be in this organization.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger discussions_target_in_org
before insert or update on public.discussions
for each row execute function private.discussion_target_in_org();

create or replace function private.discussion_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.audience is distinct from old.audience
     or new.course_id is distinct from old.course_id
     or new.class_id is distinct from old.class_id
     or new.created_by is distinct from old.created_by
     or new.title is distinct from old.title then
    raise exception 'This discussion’s title and audience can’t be changed.'
      using errcode = '23514';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    if not private.is_org_staff(old.organization_id) then
      raise exception 'Only staff can remove a discussion.'
        using errcode = '42501';
    end if;
  end if;

  if new.answered_at is distinct from old.answered_at
     or new.answered_by is distinct from old.answered_by then
    if (select auth.uid()) is distinct from old.created_by
       and not private.is_org_staff(old.organization_id) then
      raise exception 'Only the person who started this discussion, or staff, can mark it answered.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger discussions_guard_update
before update on public.discussions
for each row execute function private.discussion_guard_update();

create or replace function private.discussion_message_one_level()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent_discussion bigint;
  parent_parent bigint;
begin
  if new.parent_id is null then
    return new;
  end if;

  select m.discussion_id, m.parent_id
    into parent_discussion, parent_parent
  from public.discussion_messages m
  where m.id = new.parent_id;

  if parent_discussion is null
     or parent_discussion is distinct from new.discussion_id
     or parent_parent is not null then
    raise exception 'Replies can only sit one level under a message.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger discussion_messages_one_level
before insert or update on public.discussion_messages
for each row execute function private.discussion_message_one_level();

create or replace function private.discussion_message_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.discussion_id is distinct from old.discussion_id
     or new.parent_id is distinct from old.parent_id
     or new.author_id is distinct from old.author_id
     or new.body is distinct from old.body then
    raise exception 'This message can’t be edited.'
      using errcode = '23514';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    if (select auth.uid()) is distinct from old.author_id
       and not exists (
         select 1
         from public.discussions d
         where d.id = old.discussion_id
           and private.is_org_staff(d.organization_id)
       ) then
      raise exception 'You can only remove your own message.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger discussion_messages_guard_update
before update on public.discussion_messages
for each row execute function private.discussion_message_guard_update();

create or replace function private.discussion_touch_last_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id bigint;
  latest timestamptz;
begin
  target_id := coalesce(new.discussion_id, old.discussion_id);

  select max(m.created_at) into latest
  from public.discussion_messages m
  where m.discussion_id = target_id
    and m.deleted_at is null;

  update public.discussions d
  set last_message_at = coalesce(latest, d.created_at)
  where d.id = target_id;

  return null;
end;
$$;

create trigger discussion_messages_touch_last
after insert or update or delete on public.discussion_messages
for each row execute function private.discussion_touch_last_message();

create or replace function private.discussion_attachment_same_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  org_id bigint;
  file_org bigint;
  material_org bigint;
  material_visibility text;
begin
  select d.organization_id into org_id
  from public.discussion_messages m
  join public.discussions d on d.id = m.discussion_id
  where m.id = new.message_id;

  if org_id is null then
    raise exception 'That message isn’t available.'
      using errcode = '23514';
  end if;

  if new.kind = 'file' then
    select f.organization_id into file_org
    from public.files f
    where f.id = new.file_id
      and f.deleted_at is null;
    if file_org is null or file_org is distinct from org_id then
      raise exception 'That file needs to belong to this organization.'
        using errcode = '23514';
    end if;
  elsif new.kind = 'material' then
    select m.organization_id, m.visibility into material_org, material_visibility
    from public.materials m
    where m.id = new.material_id
      and m.deleted_at is null;
    if material_org is null
       or material_org is distinct from org_id
       or material_visibility is distinct from 'published' then
      raise exception 'Attach a published material from this organization.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger discussion_message_attachments_same_org
before insert or update on public.discussion_message_attachments
for each row execute function private.discussion_attachment_same_org();

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create or replace function private.can_start_discussion(
  p_org_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case p_audience
      when 'course' then
        p_course_id is not null
        and exists (
          select 1
          from public.courses c
          where c.id = p_course_id
            and c.organization_id = p_org_id
        )
        and (
          private.can_manage_course(p_course_id)
          or private.parent_can_view_course(p_course_id)
        )
      when 'class' then
        p_class_id is not null
        and exists (
          select 1
          from public.classes c
          where c.id = p_class_id
            and c.organization_id = p_org_id
            and c.deleted_at is null
        )
        and (
          private.is_org_staff(p_org_id)
          or private.parent_linked_to_class(p_class_id)
        )
      else false
    end;
$$;

create or replace function private.parent_can_view_discussion(p_discussion_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.discussions d
    join public.memberships m
      on m.organization_id = d.organization_id
     and m.user_id = (select auth.uid())
     and m.role = 'parent'
     and m.status = 'active'
    where d.id = p_discussion_id
      and (
        (d.audience = 'course' and private.parent_can_view_course(d.course_id))
        or (d.audience = 'class' and private.parent_linked_to_class(d.class_id))
      )
  );
$$;

create or replace function private.can_see_discussion(p_discussion_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.discussions d
    where d.id = p_discussion_id
      and (
        private.is_org_staff(d.organization_id)
        or (
          d.deleted_at is null
          and private.parent_can_view_discussion(d.id)
        )
      )
  );
$$;

-- Parents may read a file attached to a discussion they can see.
create or replace function private.parent_can_view_file(p_file_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.file_id = p_file_id
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and private.parent_can_view_course(m.course_id)
  )
  or exists (
    select 1
    from public.blocks b
    join public.materials m on m.id = b.material_id
    where b.file_id = p_file_id
      and b.deleted_at is null
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and private.parent_can_view_course(m.course_id)
  )
  or exists (
    select 1
    from public.discussion_message_attachments a
    join public.discussion_messages msg on msg.id = a.message_id
    join public.discussions d on d.id = msg.discussion_id
    where a.file_id = p_file_id
      and a.kind = 'file'
      and msg.deleted_at is null
      and d.deleted_at is null
      and private.parent_can_view_discussion(d.id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------

grant select, insert, update on table public.discussions to authenticated;
grant select, insert, update on table public.discussion_messages to authenticated;
grant select, insert on table public.discussion_message_attachments to authenticated;
grant select, insert, update on table public.discussion_reads to authenticated;
grant select, insert, update, delete on table public.discussions to service_role;
grant select, insert, update, delete on table public.discussion_messages to service_role;
grant select, insert, update, delete on table public.discussion_message_attachments to service_role;
grant select, insert, update, delete on table public.discussion_reads to service_role;
grant usage, select on sequence public.discussions_id_seq to authenticated, service_role;
grant usage, select on sequence public.discussion_messages_id_seq to authenticated, service_role;
grant usage, select on sequence public.discussion_message_attachments_id_seq to authenticated, service_role;
grant usage, select on sequence public.discussion_reads_id_seq to authenticated, service_role;

grant execute on function private.can_start_discussion(bigint, text, bigint, bigint)
  to authenticated, service_role;
grant execute on function private.parent_can_view_discussion(bigint)
  to authenticated, service_role;
grant execute on function private.can_see_discussion(bigint)
  to authenticated, service_role;
grant execute on function private.parent_can_view_file(bigint)
  to authenticated, service_role;

alter table public.discussions enable row level security;
alter table public.discussion_messages enable row level security;
alter table public.discussion_message_attachments enable row level security;
alter table public.discussion_reads enable row level security;

create policy discussions_select on public.discussions
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_discussion(id))
  )
);

create policy discussions_insert on public.discussions
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_start_discussion(
    organization_id,
    audience,
    course_id,
    class_id
  ))
);

create policy discussions_update on public.discussions
for update to authenticated
using (
  created_by = (select auth.uid())
  or (select private.is_org_staff(organization_id))
)
with check (
  created_by = (select auth.uid())
  or (select private.is_org_staff(organization_id))
);

create policy discussion_messages_select on public.discussion_messages
for select to authenticated
using ((select private.can_see_discussion(discussion_id)));

create policy discussion_messages_insert on public.discussion_messages
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.discussions d
    where d.id = discussion_id
      and d.deleted_at is null
      and (
        (select private.is_org_staff(d.organization_id))
        or (select private.parent_can_view_discussion(d.id))
      )
  )
);

create policy discussion_messages_update on public.discussion_messages
for update to authenticated
using (
  author_id = (select auth.uid())
  or exists (
    select 1
    from public.discussions d
    where d.id = discussion_id
      and (select private.is_org_staff(d.organization_id))
  )
)
with check (
  author_id = (select auth.uid())
  or exists (
    select 1
    from public.discussions d
    where d.id = discussion_id
      and (select private.is_org_staff(d.organization_id))
  )
);

create policy discussion_message_attachments_select on public.discussion_message_attachments
for select to authenticated
using (
  exists (
    select 1
    from public.discussion_messages m
    where m.id = message_id
      and (select private.can_see_discussion(m.discussion_id))
  )
);

create policy discussion_message_attachments_insert on public.discussion_message_attachments
for insert to authenticated
with check (
  exists (
    select 1
    from public.discussion_messages m
    join public.discussions d on d.id = m.discussion_id
    where m.id = message_id
      and m.author_id = (select auth.uid())
      and m.deleted_at is null
      and d.deleted_at is null
  )
);

create policy discussion_reads_select on public.discussion_reads
for select to authenticated
using (user_id = (select auth.uid()));

create policy discussion_reads_insert on public.discussion_reads
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.can_see_discussion(discussion_id))
);

create policy discussion_reads_update on public.discussion_reads
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (select private.can_see_discussion(discussion_id))
);

-- Families need to upload a file, then attach it to a post.
drop policy if exists files_select on public.files;
create policy files_select on public.files
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or uploaded_by = (select auth.uid())
  or (select private.parent_can_view_file(id))
);

drop policy if exists files_insert on public.files;
create policy files_insert on public.files
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (select private.is_org_member(organization_id))
);

drop policy if exists files_update on public.files;
create policy files_update on public.files
for update to authenticated
using (
  (select private.is_org_staff(organization_id))
  or uploaded_by = (select auth.uid())
)
with check (
  (select private.is_org_staff(organization_id))
  or uploaded_by = (select auth.uid())
);

drop policy if exists org_files_insert on storage.objects;
create policy org_files_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'org-files'
  and (
    (select private.is_org_staff((string_to_array(name, '/'))[1]::bigint))
    or (select private.is_org_member((string_to_array(name, '/'))[1]::bigint))
  )
);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.discussions replica identity full;
alter table public.discussion_messages replica identity full;
alter table public.discussion_message_attachments replica identity full;
alter table public.discussion_reads replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.discussions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.discussion_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.discussion_message_attachments;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
