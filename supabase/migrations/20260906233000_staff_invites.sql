-- Staff invites: owner / admin / instructor, copyable claim token, pending inbox.
-- Extends public.admin_invites (already in the linked P0 schema).

create schema if not exists private;

alter table public.admin_invites
  add column if not exists role text not null default 'admin';

alter table public.admin_invites
  drop constraint if exists admin_invites_role_check;

alter table public.admin_invites
  add constraint admin_invites_role_check
  check (role in ('owner', 'admin', 'instructor'));

create unique index if not exists admin_invites_pending_org_email
  on public.admin_invites (organization_id, email)
  where accepted_at is null;

create unique index if not exists admin_invites_token_key
  on public.admin_invites (token);

create index if not exists admin_invites_pending_email
  on public.admin_invites (email)
  where accepted_at is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_invites'
      and column_name = 'token'
      and column_default is null
  ) then
    execute 'alter table public.admin_invites alter column token set default gen_random_uuid()::text';
  end if;
end $$;

-- Helpers (SECURITY DEFINER, not callable by clients).
create or replace function private.current_profile_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where id = (select auth.uid());
$$;

create or replace function private.is_org_owner(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where organization_id = p_organization_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role = 'owner'
  );
$$;

create or replace function private.is_org_owner_or_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships
    where organization_id = p_organization_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

create or replace function private.has_pending_staff_invite_for_me(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_invites
    where organization_id = p_organization_id
      and accepted_at is null
      and email = private.current_profile_email()
  );
$$;

create or replace function private.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships as mine
    join public.memberships as theirs
      on theirs.organization_id = mine.organization_id
     and theirs.status = 'active'
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'
      and theirs.user_id = p_user_id
  );
$$;

revoke all on function private.current_profile_email() from public, anon, authenticated;
revoke all on function private.is_org_owner(uuid) from public, anon, authenticated;
revoke all on function private.is_org_owner_or_admin(uuid) from public, anon, authenticated;
revoke all on function private.has_pending_staff_invite_for_me(uuid) from public, anon, authenticated;
revoke all on function private.shares_org_with(uuid) from public, anon, authenticated;

create or replace function public.normalize_staff_invite()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.email := lower(trim(new.email));
  if new.email is null or new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.' using errcode = 'P0001';
  end if;

  if new.role not in ('owner', 'admin', 'instructor') then
    raise exception 'Choose owner, admin, or instructor.' using errcode = 'P0001';
  end if;

  if new.invited_by is null then
    new.invited_by := (select auth.uid());
  end if;

  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not private.is_org_owner_or_admin(new.organization_id) then
    raise exception 'Only owners and admins can invite collaborators.' using errcode = '42501';
  end if;

  if new.role = 'owner' and not private.is_org_owner(new.organization_id) then
    raise exception 'Only an owner can invite another owner.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.memberships as m
    join public.profiles as p on p.id = m.user_id
    where m.organization_id = new.organization_id
      and m.status = 'active'
      and p.email = new.email
  ) then
    raise exception 'That person is already in this organization.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists admin_invites_normalize on public.admin_invites;
create trigger admin_invites_normalize
  before insert or update of email, role, organization_id, invited_by
  on public.admin_invites
  for each row
  execute function public.normalize_staff_invite();

-- Invitee can see orgs they were invited to (for pending-request lists).
drop policy if exists organizations_select_pending_staff_invite on public.organizations;
create policy organizations_select_pending_staff_invite
  on public.organizations
  for select
  to authenticated
  using ((select private.has_pending_staff_invite_for_me(id)));

-- Invitee can read their own pending invites; managers already have org-scoped policies.
drop policy if exists admin_invites_select_own_pending on public.admin_invites;
create policy admin_invites_select_own_pending
  on public.admin_invites
  for select
  to authenticated
  using (
    accepted_at is null
    and email = (select private.current_profile_email())
  );

drop policy if exists admin_invites_insert_managers on public.admin_invites;
create policy admin_invites_insert_managers
  on public.admin_invites
  for insert
  to authenticated
  with check ((select private.is_org_owner_or_admin(organization_id)));

drop policy if exists admin_invites_select_managers on public.admin_invites;
create policy admin_invites_select_managers
  on public.admin_invites
  for select
  to authenticated
  using ((select private.is_org_owner_or_admin(organization_id)));

drop policy if exists admin_invites_delete_pending_managers on public.admin_invites;
create policy admin_invites_delete_pending_managers
  on public.admin_invites
  for delete
  to authenticated
  using (
    accepted_at is null
    and (select private.is_org_owner_or_admin(organization_id))
  );

drop policy if exists profiles_select_org_peers on public.profiles;
create policy profiles_select_org_peers
  on public.profiles
  for select
  to authenticated
  using ((select private.shares_org_with(id)));

grant select, insert, delete on table public.admin_invites to authenticated;

create or replace function public.get_staff_invite(p_token text)
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  accepted_at timestamptz,
  email_matches boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select profiles.email into caller_email
  from public.profiles
  where profiles.id = caller;

  return query
  select
    i.id,
    i.organization_id,
    o.name,
    o.slug,
    i.email,
    i.role,
    i.accepted_at,
    (i.email = caller_email) as email_matches
  from public.admin_invites as i
  join public.organizations as o on o.id = i.organization_id
  where i.token = p_token;
end;
$$;

create or replace function public.claim_staff_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
  invite public.admin_invites%rowtype;
  member_id uuid;
  org_slug text;
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into invite
  from public.admin_invites
  where token = p_token
  for update;

  if not found then
    raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
  end if;

  select slug into org_slug
  from public.organizations
  where id = invite.organization_id;

  select email into caller_email
  from public.profiles
  where id = caller;

  if caller_email is distinct from invite.email then
    raise exception 'Sign in with the invited email to accept.' using errcode = 'P0001';
  end if;

  select m.id into member_id
  from public.memberships as m
  where m.organization_id = invite.organization_id
    and m.user_id = caller
    and m.status = 'active';

  if member_id is not null then
    if invite.accepted_at is null then
      update public.admin_invites
      set accepted_at = now(), membership_id = member_id
      where id = invite.id;
    end if;
    return org_slug;
  end if;

  if invite.accepted_at is not null then
    raise exception 'This invite was already accepted.' using errcode = 'P0001';
  end if;

  insert into public.memberships (organization_id, user_id, role, status)
  values (invite.organization_id, caller, invite.role, 'active')
  returning id into member_id;

  update public.admin_invites
  set accepted_at = now(), membership_id = member_id
  where id = invite.id;

  return org_slug;
end;
$$;

revoke all on function public.get_staff_invite(text) from public, anon;
grant execute on function public.get_staff_invite(text) to authenticated;

revoke all on function public.claim_staff_invite(text) from public, anon;
grant execute on function public.claim_staff_invite(text) to authenticated;

revoke all on function public.normalize_staff_invite() from public, anon, authenticated;
