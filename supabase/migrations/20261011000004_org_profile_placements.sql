-- HN-020 — Pre-claim course teachers and class leads stay in the course's
-- organization. In-org names are readable by any member without exposing
-- contact email to families. Claiming a student invite marks the person as
-- a student and does not rename either profile.

create or replace function private.sync_course_instructor_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_org bigint;
  profile_org bigint;
  profile_user uuid;
begin
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;

  if new.org_profile_id is null and new.user_id is not null then
    select op.id into new.org_profile_id
    from public.org_profiles op
    where op.organization_id = course_org
      and op.user_id = new.user_id;
  end if;

  if new.org_profile_id is not null then
    select op.organization_id, op.user_id
      into profile_org, profile_user
    from public.org_profiles op
    where op.id = new.org_profile_id;

    if profile_org is null or profile_org is distinct from course_org then
      raise exception 'Choose a person in this organization.'
        using errcode = 'P0001';
    end if;

    -- The placement account is the org person's account. Unclaimed stays null.
    new.user_id := profile_user;
  end if;

  if new.org_profile_id is null then
    raise exception 'Choose a person in this organization.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create or replace function private.sync_class_leader_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  class_org bigint;
  profile_org bigint;
  profile_user uuid;
begin
  select k.organization_id into class_org
  from public.classes k
  where k.id = new.class_id;

  if new.org_profile_id is null and new.user_id is not null then
    select op.id into new.org_profile_id
    from public.org_profiles op
    where op.organization_id = class_org
      and op.user_id = new.user_id;
  end if;

  if new.org_profile_id is not null then
    select op.organization_id, op.user_id
      into profile_org, profile_user
    from public.org_profiles op
    where op.id = new.org_profile_id;

    if profile_org is null or profile_org is distinct from class_org then
      raise exception 'Choose a person in this organization.'
        using errcode = 'P0001';
    end if;

    new.user_id := profile_user;
  end if;

  if new.org_profile_id is null then
    raise exception 'Choose a person in this organization.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Names for roster, teachers, and “on behalf of”. Email only for staff browse.
create or replace function public.org_member_names(p_organization_id bigint)
returns table (
  id bigint,
  user_id uuid,
  name text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    op.id,
    op.user_id,
    op.name,
    case
      when private.can_browse_as_staff(p_organization_id) then op.email
      else null
    end as email
  from public.org_profiles op
  where op.organization_id = p_organization_id
    and private.is_org_member(p_organization_id)
$$;

revoke all on function public.org_member_names(bigint) from public, anon;
grant execute on function public.org_member_names(bigint)
  to authenticated, service_role;

-- Instructors can turn an existing non-student into a student without a
-- second person. The org name stays. RLS would hide that row from them.
create or replace function public.mark_org_profile_as_student(
  p_org_profile_id bigint,
  p_grade_level text,
  p_parent_email text,
  p_created_via_course_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id bigint;
  already boolean;
begin
  select op.organization_id, op.counts_as_student
    into org_id, already
  from public.org_profiles op
  where op.id = p_org_profile_id
  for update;

  if org_id is null then
    raise exception 'That person couldn’t be found.'
      using errcode = 'P0002';
  end if;

  if not private.is_org_staff(org_id) then
    raise exception 'You don’t have permission to add a student.'
      using errcode = '42501';
  end if;

  if already then
    raise exception 'That email is already used in this organization.'
      using errcode = 'P0001';
  end if;

  update public.org_profiles
  set
    counts_as_student = true,
    grade_level = p_grade_level,
    parent_email = p_parent_email,
    created_via_course_id = coalesce(p_created_via_course_id, created_via_course_id)
  where id = p_org_profile_id;
end;
$$;

revoke all on function public.mark_org_profile_as_student(bigint, text, text, bigint)
  from public, anon;
grant execute on function public.mark_org_profile_as_student(bigint, text, text, bigint)
  to authenticated, service_role;

do $$
declare
  def text := pg_get_functiondef('public.claim_invite(text)'::regprocedure);
  next text;
begin
  next := regexp_replace(
    def,
    'set user_id = caller(\s+)where id = invite\.student_profile_id',
    'set user_id = caller, counts_as_student = true\1where id = invite.student_profile_id'
  );
  if next = def then
    raise exception 'claim_invite student link was not found.';
  end if;
  execute next;
end;
$$;
