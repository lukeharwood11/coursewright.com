-- Staff may remove a student from the org roster. Parent-only and staff-only
-- org profiles stay. Related class membership, enrollments, parent links, and
-- invites still cascade. The student-role membership trigger is unchanged.

drop policy if exists student_profiles_delete on public.org_profiles;

create policy org_profiles_delete on public.org_profiles
for delete to authenticated
using (
  counts_as_student
  and (select private.is_org_staff(organization_id))
);
