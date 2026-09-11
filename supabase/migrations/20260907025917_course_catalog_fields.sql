-- Course catalog fields: description is already on courses.
-- Add location, subject, and published/unpublished visibility.
-- Existing courses stay published so current parent access does not disappear.
-- New courses default unpublished.

alter table public.courses
  add column location text not null default '';

alter table public.courses
  add column subject text not null default '';

alter table public.courses
  add column visibility text not null default 'published';

alter table public.courses
  alter column visibility set default 'unpublished';

alter table public.courses
  add constraint courses_visibility_chk
  check (visibility in ('published', 'unpublished'));

create index courses_org_published_idx
  on public.courses (organization_id)
  where visibility = 'published' and status = 'active';

drop index if exists public.courses_search_idx;
alter table public.courses drop column search_vector;
alter table public.courses
  add column search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(subject, '') || ' ' ||
      coalesce(location, '')
    )
  ) stored;
create index courses_search_idx on public.courses using gin (search_vector);

comment on column public.courses.location is 'Optional where the offering meets';
comment on column public.courses.subject is 'Optional subject / area, free text';
comment on column public.courses.visibility is
  'published = enrolled parents (and students later); unpublished = instructors/admins only';

create or replace function private.parent_can_view_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses c
    join public.enrollments e
      on e.course_id = c.id
     and e.status = 'active'
    join public.parent_student_links psl
      on psl.student_profile_id = e.student_profile_id
     and psl.parent_user_id = (select auth.uid())
    join public.memberships m
      on m.organization_id = c.organization_id
     and m.user_id = (select auth.uid())
     and m.role = 'parent'
     and m.status = 'active'
    where c.id = p_course_id
      and c.status = 'active'
      and c.visibility = 'published'
  );
$$;

grant execute on function private.parent_can_view_course(bigint)
  to authenticated, service_role;
