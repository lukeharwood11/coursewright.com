-- Fix create-course INSERT … RETURNING after 20260928000000 narrowed courses
-- SELECT to can_view_course(id). That helper re-reads public.courses by id; the
-- in-flight insert is invisible in the same command, so PostgREST returns
-- "new row violates row-level security policy for table courses".
--
-- is_course_instructor(id) alone is also insufficient for RETURNING: the
-- after-insert course_instructors row is not visible to the same command's
-- SELECT policy. Allow org staff to see a course only when no *other*
-- instructor exists (creator / orphan). course_has_other_instructors is
-- SECURITY DEFINER so the check is not blinded by course_instructors RLS.

create or replace function private.course_has_other_instructors(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_instructors ci
    where ci.course_id = p_course_id
      and ci.user_id is distinct from (select auth.uid())
  );
$$;

grant execute on function private.course_has_other_instructors(bigint)
  to authenticated, service_role;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
for select to authenticated
using (
  (select private.is_org_admin(organization_id))
  or (select private.is_course_instructor(id))
  or (select private.parent_can_view_course(id))
  or (
    (select private.is_org_staff(organization_id))
    and not (select private.course_has_other_instructors(id))
  )
);

-- Only membership role = instructor is auto-assigned on create. Owners/admins
-- must add teachers (including themselves) from course settings / roster.
create or replace function private.on_course_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = (select auth.uid())
      and m.role = 'instructor'
      and m.status = 'active'
  ) then
    insert into public.course_instructors (course_id, user_id)
    values (new.id, (select auth.uid()))
    on conflict (course_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
