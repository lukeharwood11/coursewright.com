-- One-way announcements: course, class, or student audience (FEATURES P0).
-- Optional start/end dates are homepage availability. Soft-delete only.
-- HN-017: apply this migration on the testing (and later production) database.

create table public.announcements (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  audience text not null,
  course_id bigint references public.courses (id) on delete cascade,
  class_id bigint references public.classes (id) on delete cascade,
  student_profile_id bigint references public.student_profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  start_date date,
  end_date date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint announcements_title_chk check (char_length(btrim(title)) > 0),
  constraint announcements_audience_chk check (audience in ('course', 'class', 'student')),
  constraint announcements_audience_target_chk check (
    (
      audience = 'course'
      and course_id is not null
      and class_id is null
      and student_profile_id is null
    )
    or (
      audience = 'class'
      and class_id is not null
      and course_id is null
      and student_profile_id is null
    )
    or (
      audience = 'student'
      and student_profile_id is not null
      and course_id is null
      and class_id is null
    )
  ),
  constraint announcements_date_range_chk check (
    start_date is null
    or end_date is null
    or end_date >= start_date
  )
);

create index announcements_organization_id_idx
  on public.announcements (organization_id)
  where deleted_at is null;
create index announcements_course_id_idx
  on public.announcements (course_id)
  where deleted_at is null and audience = 'course';
create index announcements_class_id_idx
  on public.announcements (class_id)
  where deleted_at is null and audience = 'class';
create index announcements_student_profile_id_idx
  on public.announcements (student_profile_id)
  where deleted_at is null and audience = 'student';
create index announcements_created_by_idx on public.announcements (created_by);

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function private.set_updated_at();

comment on table public.announcements is
  'SCHEMA.md Announcement — one-way notice to a course, class, or student';
comment on column public.announcements.start_date is
  'First local calendar day families see this on home (inclusive); null = already current';
comment on column public.announcements.end_date is
  'Last local calendar day families see this on home (inclusive); null = until removed';

create or replace function private.announcement_target_in_org()
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
  elsif new.audience = 'class' then
    select c.organization_id into target_org
    from public.classes c
    where c.id = new.class_id;
  else
    select s.organization_id into target_org
    from public.student_profiles s
    where s.id = new.student_profile_id;
  end if;

  if target_org is null or target_org is distinct from new.organization_id then
    raise exception 'That audience needs to be in this organization.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger announcements_target_in_org
before insert or update on public.announcements
for each row execute function private.announcement_target_in_org();

create table public.announcement_reads (
  id bigserial primary key,
  announcement_id bigint not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint announcement_reads_announcement_user_key unique (announcement_id, user_id)
);

create index announcement_reads_user_id_idx
  on public.announcement_reads (user_id);
create index announcement_reads_announcement_id_idx
  on public.announcement_reads (announcement_id);

comment on table public.announcement_reads is
  'SCHEMA.md AnnouncementRead — per-user read receipt';

create or replace function private.can_post_announcement(
  p_org_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint,
  p_student_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    case p_audience
      when 'course' then private.can_manage_course(p_course_id)
      when 'class' then
        private.is_org_staff(p_org_id)
        and exists (
          select 1
          from public.classes c
          where c.id = p_class_id
            and c.organization_id = p_org_id
            and c.deleted_at is null
        )
      when 'student' then
        private.is_org_staff(p_org_id)
        and exists (
          select 1
          from public.student_profiles s
          where s.id = p_student_id
            and s.organization_id = p_org_id
        )
      else false
    end;
$$;

create or replace function private.parent_can_view_announcement(p_announcement_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.announcements a
    join public.memberships m
      on m.organization_id = a.organization_id
     and m.user_id = (select auth.uid())
     and m.role = 'parent'
     and m.status = 'active'
    where a.id = p_announcement_id
      and (
        (
          a.audience = 'course'
          and a.course_id is not null
          and private.parent_can_view_course(a.course_id)
        )
        or (
          a.audience = 'class'
          and a.class_id is not null
          and exists (
            select 1
            from public.classes c
            join public.class_members cm
              on cm.class_id = c.id
            join public.parent_student_links psl
              on psl.student_profile_id = cm.student_profile_id
             and psl.parent_user_id = (select auth.uid())
            where c.id = a.class_id
              and c.organization_id = a.organization_id
              and c.deleted_at is null
          )
        )
        or (
          a.audience = 'student'
          and a.student_profile_id is not null
          and private.parent_linked_to_student(a.student_profile_id)
        )
      )
  );
$$;

grant execute on function private.can_post_announcement(bigint, text, bigint, bigint, bigint)
  to authenticated, service_role;
grant execute on function private.parent_can_view_announcement(bigint)
  to authenticated, service_role;

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

revoke all on table public.announcements from anon, authenticated;
revoke all on table public.announcement_reads from anon, authenticated;

grant select, insert, update on table public.announcements to authenticated;
grant select, insert on table public.announcement_reads to authenticated;
grant select, insert, update, delete on table public.announcements to service_role;
grant select, insert, update, delete on table public.announcement_reads to service_role;

create policy announcements_select on public.announcements
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_announcement(id))
  )
);

create policy announcements_insert on public.announcements
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_post_announcement(
    organization_id,
    audience,
    course_id,
    class_id,
    student_profile_id
  ))
);

create policy announcements_update on public.announcements
for update to authenticated
using (
  (select private.can_post_announcement(
    organization_id,
    audience,
    course_id,
    class_id,
    student_profile_id
  ))
)
with check (
  (select private.can_post_announcement(
    organization_id,
    audience,
    course_id,
    class_id,
    student_profile_id
  ))
);

create policy announcement_reads_select on public.announcement_reads
for select to authenticated
using (user_id = (select auth.uid()));

create policy announcement_reads_insert on public.announcement_reads
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.announcements a
    where a.id = announcement_id
      and a.deleted_at is null
      and (
        (select private.is_org_staff(a.organization_id))
        or (select private.parent_can_view_announcement(a.id))
      )
  )
);

-- Families need class membership (and class titles) to attribute class announcements.
create policy classes_parent_select on public.classes
for select to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.class_members cm
    join public.parent_student_links psl
      on psl.student_profile_id = cm.student_profile_id
     and psl.parent_user_id = (select auth.uid())
    where cm.class_id = classes.id
  )
);

create policy class_members_parent_select on public.class_members
for select to authenticated
using ((select private.parent_linked_to_student(student_profile_id)));
