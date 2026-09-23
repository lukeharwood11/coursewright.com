-- Staff can remove a student profile from the org roster. Related class
-- membership, enrollments, parent links, and invites cascade. A student-role
-- membership for this profile's account ends; a staff role is left alone.

grant delete on table public.student_profiles to authenticated;

create policy student_profiles_delete on public.student_profiles
for delete to authenticated
using ((select private.is_org_staff(organization_id)));

create or replace function private.remove_student_account_on_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.user_id is not null then
    delete from public.memberships
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role = 'student';
  end if;
  return old;
end;
$$;

create trigger student_profiles_remove_student_account
before delete on public.student_profiles
for each row
execute function private.remove_student_account_on_profile_delete();
