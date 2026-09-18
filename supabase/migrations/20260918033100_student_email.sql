-- Optional student contact email on student_profiles.
-- Dedicated student login remains P2; inviting this email uses the existing
-- parent claim path so that person can view this student's work.

alter table public.student_profiles
  add column student_email text;

alter table public.student_profiles
  add constraint student_profiles_student_email_lower_chk check (
    student_email is null or student_email = lower(student_email)
  );

comment on column public.student_profiles.student_email is
  'Optional student contact email. Invite uses parent claim path; student role is P2.';

comment on column public.student_profiles.parent_email is
  'Optional first parent email for search/create. Additional parents live on parent_student_links and admin_invites.';

create or replace function private.normalize_student_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  if new.parent_email is not null then
    new.parent_email := lower(btrim(new.parent_email));
    if new.parent_email = '' then
      new.parent_email := null;
    end if;
  end if;
  if new.student_email is not null then
    new.student_email := lower(btrim(new.student_email));
    if new.student_email = '' then
      new.student_email := null;
    end if;
  end if;
  if new.grade_level is not null then
    if not exists (
      select 1
      from public.organizations o
      where o.id = new.organization_id
        and new.grade_level = any (o.grade_labels)
    ) then
      raise exception 'grade_level must match the organization grade scheme';
    end if;
  end if;
  return new;
end;
$$;
