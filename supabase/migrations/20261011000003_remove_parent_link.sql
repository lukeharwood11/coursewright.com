-- Staff may unlink a parent from a student. Orphan parent-only org profiles are removed.

create or replace function private.refresh_student_parent_email(p_student_profile_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.org_profiles sp
  set parent_email = (
    select p.email
    from public.parent_student_links psl
    join public.org_profiles p on p.id = psl.parent_org_profile_id
    where psl.student_profile_id = p_student_profile_id
      and p.email is not null
    order by psl.parent_org_profile_id
    limit 1
  )
  where sp.id = p_student_profile_id
    and sp.counts_as_student;
$$;

create or replace function private.delete_parent_org_profile_if_orphaned(
  p_parent_org_profile_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_row public.org_profiles%rowtype;
begin
  if exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_org_profile_id = p_parent_org_profile_id
  ) then
    return;
  end if;

  select * into parent_row
  from public.org_profiles op
  where op.id = p_parent_org_profile_id;

  if not found or parent_row.counts_as_student then
    return;
  end if;

  if exists (
    select 1
    from public.course_instructors ci
    where ci.org_profile_id = p_parent_org_profile_id
  ) or exists (
    select 1
    from public.class_leaders cl
    where cl.org_profile_id = p_parent_org_profile_id
  ) then
    return;
  end if;

  if parent_row.user_id is not null and exists (
    select 1
    from public.memberships m
    where m.organization_id = parent_row.organization_id
      and m.user_id = parent_row.user_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'instructor', 'observer')
  ) then
    return;
  end if;

  perform set_config('coursewright.org_profile_link', '1', true);
  delete from public.org_profiles op
  where op.id = p_parent_org_profile_id;
end;
$$;

create or replace function public.remove_parent_from_student(
  p_student_profile_id bigint,
  p_parent_org_profile_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id bigint;
  deleted_link bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to continue.'
      using errcode = '42501';
  end if;

  select sp.organization_id into org_id
  from public.org_profiles sp
  where sp.id = p_student_profile_id
    and sp.counts_as_student;

  if org_id is null then
    raise exception 'That student couldn''t be found.'
      using errcode = 'P0001';
  end if;

  if not (select private.is_org_staff(org_id)) then
    raise exception 'You don''t have permission to change this student.'
      using errcode = '42501';
  end if;

  delete from public.parent_student_links psl
  where psl.student_profile_id = p_student_profile_id
    and psl.parent_org_profile_id = p_parent_org_profile_id
  returning psl.parent_org_profile_id into deleted_link;

  if deleted_link is null then
    raise exception 'That parent isn''t linked to this student.'
      using errcode = 'P0001';
  end if;

  perform private.refresh_student_parent_email(p_student_profile_id);
  perform private.delete_parent_org_profile_if_orphaned(p_parent_org_profile_id);
end;
$$;

revoke all on function private.refresh_student_parent_email(bigint) from public, anon;
revoke all on function private.delete_parent_org_profile_if_orphaned(bigint) from public, anon;
grant execute on function private.refresh_student_parent_email(bigint) to service_role;
grant execute on function private.delete_parent_org_profile_if_orphaned(bigint) to service_role;

revoke all on function public.remove_parent_from_student(bigint, bigint) from public, anon;
grant execute on function public.remove_parent_from_student(bigint, bigint) to authenticated;
