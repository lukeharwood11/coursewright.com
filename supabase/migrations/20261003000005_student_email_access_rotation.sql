-- A student email is both contact data and the address used for a student
-- account invitation. Changing it must not leave the former address with
-- access or a still-claimable invite.

create or replace function private.rotate_student_email_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending_invited_by uuid;
begin
  if new.student_email is not distinct from old.student_email then
    return new;
  end if;

  select i.invited_by
    into pending_invited_by
  from public.admin_invites i
  where i.student_profile_id = old.id
    and i.role = 'student'
    and i.accepted_at is null
  order by i.created_at desc, i.id desc
  limit 1;

  -- Invalidates every outstanding token for the former student email.
  delete from public.admin_invites
  where student_profile_id = old.id
    and role = 'student'
    and accepted_at is null;

  if old.user_id is not null then
    -- Keep a promoted staff membership, but end a student-role membership.
    delete from public.memberships
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role = 'student';

    new.user_id := null;
  elsif pending_invited_by is not null and new.student_email is not null then
    -- Preserve the intent of an already-sent invite with a fresh token.
    insert into public.admin_invites (
      organization_id,
      email,
      invited_by,
      role,
      student_profile_id
    ) values (
      old.organization_id,
      new.student_email,
      coalesce((select auth.uid()), pending_invited_by),
      'student',
      old.id
    );
  end if;

  return new;
end;
$$;

create trigger student_profiles_rotate_email_access
before update of student_email on public.student_profiles
for each row
execute function private.rotate_student_email_access();

comment on column public.student_profiles.student_email is
  'Optional student contact email. Changing it revokes a linked student account or rotates a pending student invite.';
