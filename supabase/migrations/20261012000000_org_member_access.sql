-- Owners/admins suspend, restore, or remove claimed members from an organization.

create or replace function private.org_member_access_target(p_membership_id bigint)
returns table (
  organization_id bigint,
  target_user_id uuid,
  target_role text,
  target_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
  select m.organization_id, m.user_id, m.role, m.status
  from public.memberships m
  where m.id = p_membership_id
    and m.user_id is not null;
end;
$$;

create or replace function private.assert_org_admin_membership_action(
  p_membership_id bigint,
  p_allow_suspended boolean default false
)
returns table (
  organization_id bigint,
  target_user_id uuid,
  target_role text,
  target_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_rec record;
  caller uuid;
begin
  caller := (select auth.uid());
  if caller is null then
    raise exception 'Sign in to continue.'
      using errcode = '42501';
  end if;

  select * into row_rec
  from private.org_member_access_target(p_membership_id);

  if row_rec.organization_id is null then
    raise exception 'That person couldn''t be found.'
      using errcode = 'P0001';
  end if;

  if not (select private.is_org_admin(row_rec.organization_id)) then
    raise exception 'You don''t have permission to change member access.'
      using errcode = '42501';
  end if;

  if row_rec.target_user_id = caller then
    raise exception 'You can''t change your own access here.'
      using errcode = 'P0001';
  end if;

  if row_rec.target_role = 'owner' then
    raise exception 'Owner access can''t be changed here.'
      using errcode = 'P0001';
  end if;

  if not p_allow_suspended and row_rec.target_status <> 'active' then
    raise exception 'That membership isn''t active.'
      using errcode = 'P0001';
  end if;

  organization_id := row_rec.organization_id;
  target_user_id := row_rec.target_user_id;
  target_role := row_rec.target_role;
  target_status := row_rec.target_status;
  return next;
end;
$$;

create or replace function private.assert_another_active_org_manager(
  p_organization_id bigint,
  p_exclude_membership_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining int;
begin
  select count(*) into remaining
  from public.memberships m
  where m.organization_id = p_organization_id
    and m.role in ('owner', 'admin')
    and m.status = 'active'
    and m.id is distinct from p_exclude_membership_id;

  if remaining < 1 then
    raise exception 'cannot remove or demote the last remaining owner or admin'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.suspend_org_member(p_membership_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
begin
  select * into target
  from private.assert_org_admin_membership_action(p_membership_id, false);

  if target.target_status = 'suspended' then
    return;
  end if;

  if target.target_role in ('owner', 'admin') then
    perform private.assert_another_active_org_manager(
      target.organization_id,
      p_membership_id
    );
  end if;

  update public.memberships
  set status = 'suspended'
  where id = p_membership_id
    and status = 'active';
end;
$$;

create or replace function public.reactivate_org_member(p_membership_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
begin
  select * into target
  from private.assert_org_admin_membership_action(p_membership_id, true);

  if target.target_status <> 'suspended' then
    raise exception 'That person isn''t suspended.'
      using errcode = 'P0001';
  end if;

  update public.memberships
  set status = 'active'
  where id = p_membership_id
    and status = 'suspended';
end;
$$;

create or replace function public.remove_member_from_org(p_membership_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
  profile_id bigint;
begin
  select * into target
  from private.assert_org_admin_membership_action(p_membership_id, true);

  if target.target_role in ('owner', 'admin') and target.target_status = 'active' then
    perform private.assert_another_active_org_manager(
      target.organization_id,
      p_membership_id
    );
  end if;

  select op.id into profile_id
  from public.org_profiles op
  where op.organization_id = target.organization_id
    and op.user_id = target.target_user_id
  limit 1;

  if profile_id is not null then
    delete from public.admin_invites
    where org_profile_id = profile_id
      and accepted_at is null;
  end if;

  delete from public.memberships
  where id = p_membership_id;

  update public.org_profiles
  set user_id = null
  where organization_id = target.organization_id
    and user_id = target.target_user_id;
end;
$$;

revoke all on function private.org_member_access_target(bigint) from public, anon;
revoke all on function private.assert_org_admin_membership_action(bigint, boolean) from public, anon;
revoke all on function private.assert_another_active_org_manager(bigint, bigint) from public, anon;
grant execute on function private.org_member_access_target(bigint) to service_role;
grant execute on function private.assert_org_admin_membership_action(bigint, boolean) to service_role;
grant execute on function private.assert_another_active_org_manager(bigint, bigint) to service_role;

revoke all on function public.suspend_org_member(bigint) from public, anon;
revoke all on function public.reactivate_org_member(bigint) from public, anon;
revoke all on function public.remove_member_from_org(bigint) from public, anon;
grant execute on function public.suspend_org_member(bigint) to authenticated;
grant execute on function public.reactivate_org_member(bigint) to authenticated;
grant execute on function public.remove_member_from_org(bigint) to authenticated;
