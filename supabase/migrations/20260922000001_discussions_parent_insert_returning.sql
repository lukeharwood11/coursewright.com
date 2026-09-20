-- Parent Start discussion: PostgREST INSERT … RETURNING must pass SELECT USING.
-- The previous discussions SELECT policy called parent_can_view_discussion(id),
-- which re-reads public.discussions. That nested scan cannot see the in-flight
-- row (same command ID), so parents got "new row violates row-level security".
-- Staff INSERT RETURNING already passed via is_org_staff(organization_id) on
-- the new tuple. Evaluate parent visibility from audience columns instead.
-- Enrollment / class-membership gates are unchanged.
--
-- Apply this file if 20260922000000_discussions.sql is already on the linked
-- database. A fresh migrate / nuke applies both; this migration is idempotent.

create or replace function private.parent_can_view_discussion(
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
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role = 'parent'
      and m.status = 'active'
      and (
        (p_audience = 'course' and private.parent_can_view_course(p_course_id))
        or (p_audience = 'class' and private.parent_linked_to_class(p_class_id))
      )
  );
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
    where d.id = p_discussion_id
      and private.parent_can_view_discussion(
        d.organization_id,
        d.audience,
        d.course_id,
        d.class_id
      )
  );
$$;

grant execute on function private.parent_can_view_discussion(bigint, text, bigint, bigint)
  to authenticated, service_role;
grant execute on function private.parent_can_view_discussion(bigint)
  to authenticated, service_role;

drop policy if exists discussions_select on public.discussions;
create policy discussions_select on public.discussions
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_discussion(
      organization_id,
      audience,
      course_id,
      class_id
    ))
  )
);
