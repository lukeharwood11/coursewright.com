-- Unified email-claim invites: role is payload (owner / admin / instructor / parent).
-- Membership is created on claim. Course access still requires enrollment.
-- v0: copyable /invite/<token> — Course Wright does not send email.

-- P0 created an invited membership (always admin) on insert. Claim creates membership.
drop trigger if exists admin_invites_before_insert on public.admin_invites;
drop function if exists private.admin_invites_before_insert();

alter table public.admin_invites
  add column if not exists role text not null default 'admin';

alter table public.admin_invites
  add column if not exists student_profile_id bigint references public.student_profiles (id) on delete cascade;

alter table public.admin_invites
  drop constraint if exists admin_invites_role_check;

alter table public.admin_invites
  add constraint admin_invites_role_check
  check (role in ('owner', 'admin', 'instructor', 'parent'));

alter table public.admin_invites
  drop constraint if exists admin_invites_parent_student_chk;

alter table public.admin_invites
  add constraint admin_invites_parent_student_chk
  check (
    (role = 'parent' and student_profile_id is not null)
    or (role in ('owner', 'admin', 'instructor') and student_profile_id is null)
  );

drop index if exists public.admin_invites_pending_org_email_uidx;
drop index if exists public.admin_invites_pending_org_email;

create unique index if not exists admin_invites_pending_staff_email_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null and role in ('owner', 'admin', 'instructor');

create unique index if not exists admin_invites_pending_parent_uidx
  on public.admin_invites (organization_id, email, student_profile_id)
  where accepted_at is null and role = 'parent';

create index if not exists admin_invites_pending_email
  on public.admin_invites (email)
  where accepted_at is null;

create index if not exists admin_invites_student_profile_id_idx
  on public.admin_invites (student_profile_id);

comment on table public.admin_invites is
  'SCHEMA.md AdminInvite — email-claim tokens for owner/admin/instructor/parent. Membership is created on claim.';

-- Parent email-claim tokens live on admin_invites (role = parent). Retire the extra table.
alter table public.share_links
  drop constraint if exists share_links_parent_invite_id_fkey;

drop policy if exists parent_invites_select on public.parent_invites;
drop policy if exists parent_invites_insert on public.parent_invites;
drop policy if exists parent_invites_update on public.parent_invites;
drop policy if exists parent_invites_delete on public.parent_invites;
drop trigger if exists parent_invites_before_insert on public.parent_invites;
drop function if exists private.parent_invites_before_insert();
drop table if exists public.parent_invites;

alter table public.share_links
  add constraint share_links_parent_invite_id_fkey
  foreign key (parent_invite_id) references public.admin_invites (id) on delete cascade;

create or replace function private.current_profile_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function private.has_pending_invite_for_me(p_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_invites i
    where i.organization_id = p_organization_id
      and i.accepted_at is null
      and i.email = private.current_profile_email()
  );
$$;

revoke all on function private.current_profile_email() from public, anon, authenticated;
revoke all on function private.has_pending_invite_for_me(bigint) from public, anon, authenticated;
grant execute on function private.current_profile_email() to authenticated, service_role;
grant execute on function private.has_pending_invite_for_me(bigint) to authenticated, service_role;

create or replace function public.normalize_org_invite()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  student_org bigint;
begin
  new.email := lower(trim(new.email));
  if new.email is null or new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.' using errcode = 'P0001';
  end if;

  if new.role not in ('owner', 'admin', 'instructor', 'parent') then
    raise exception 'Choose a valid invite role.' using errcode = 'P0001';
  end if;

  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if new.invited_by is null then
    new.invited_by := (select auth.uid());
  end if;

  if new.role = 'parent' then
    if new.student_profile_id is null then
      raise exception 'Choose a student to invite this parent for.' using errcode = 'P0001';
    end if;

    if not private.is_org_staff(new.organization_id) then
      raise exception 'Only staff can invite parents.' using errcode = '42501';
    end if;

    select sp.organization_id into student_org
    from public.student_profiles sp
    where sp.id = new.student_profile_id;

    if student_org is distinct from new.organization_id then
      raise exception 'That student is not in this organization.' using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.parent_student_links psl
      join public.profiles p on p.id = psl.parent_user_id
      where psl.student_profile_id = new.student_profile_id
        and p.email = new.email
    ) then
      raise exception 'That parent is already linked to this student.' using errcode = 'P0001';
    end if;
  else
    new.student_profile_id := null;

    if not private.is_org_admin(new.organization_id) then
      raise exception 'Only owners and admins can invite collaborators.' using errcode = '42501';
    end if;

    if new.role = 'owner' and not private.is_org_owner(new.organization_id) then
      raise exception 'Only an owner can invite another owner.' using errcode = '42501';
    end if;

    if exists (
      select 1
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      where m.organization_id = new.organization_id
        and m.status = 'active'
        and p.email = new.email
    ) then
      raise exception 'That person is already in this organization.' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_invites_normalize on public.admin_invites;
drop function if exists public.normalize_staff_invite();
create trigger admin_invites_normalize
  before insert or update of email, role, organization_id, invited_by, student_profile_id
  on public.admin_invites
  for each row
  execute function public.normalize_org_invite();

drop policy if exists organizations_select_pending_staff_invite on public.organizations;
create policy organizations_select_pending_invite
  on public.organizations
  for select
  to authenticated
  using ((select private.has_pending_invite_for_me(id)));

drop policy if exists admin_invites_select on public.admin_invites;
drop policy if exists admin_invites_insert on public.admin_invites;
drop policy if exists admin_invites_update on public.admin_invites;
drop policy if exists admin_invites_delete on public.admin_invites;
drop policy if exists admin_invites_select_own_pending on public.admin_invites;
drop policy if exists admin_invites_insert_managers on public.admin_invites;
drop policy if exists admin_invites_select_managers on public.admin_invites;
drop policy if exists admin_invites_delete_pending_managers on public.admin_invites;

create policy admin_invites_select on public.admin_invites
  for select
  to authenticated
  using (
    (
      accepted_at is null
      and email = (select private.current_profile_email())
    )
    or (
      role in ('owner', 'admin', 'instructor')
      and (select private.is_org_admin(organization_id))
    )
    or (
      role = 'parent'
      and (select private.is_org_staff(organization_id))
    )
  );

create policy admin_invites_insert on public.admin_invites
  for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and (
      (
        role in ('owner', 'admin', 'instructor')
        and (select private.is_org_admin(organization_id))
      )
      or (
        role = 'parent'
        and (select private.is_org_staff(organization_id))
      )
    )
  );

create policy admin_invites_delete on public.admin_invites
  for delete
  to authenticated
  using (
    accepted_at is null
    and (
      (
        role in ('owner', 'admin', 'instructor')
        and (select private.is_org_admin(organization_id))
      )
      or (
        role = 'parent'
        and (select private.is_org_staff(organization_id))
      )
    )
  );

revoke update on table public.admin_invites from authenticated;

create or replace function public.get_invite(p_token text)
returns table (
  id bigint,
  organization_id bigint,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  student_profile_id bigint,
  student_name text,
  accepted_at timestamptz,
  email_matches boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
begin
  if caller is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select p.email into caller_email
  from public.profiles p
  where p.id = caller;

  return query
  select
    i.id,
    i.organization_id,
    o.name,
    o.slug,
    i.email,
    i.role,
    i.student_profile_id,
    sp.name,
    i.accepted_at,
    (i.email = caller_email) as email_matches
  from public.admin_invites i
  join public.organizations o on o.id = i.organization_id
  left join public.student_profiles sp on sp.id = i.student_profile_id
  where i.token = p_token;
end;
$$;

create or replace function public.claim_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
  invite public.admin_invites%rowtype;
  member_id bigint;
  member_role text;
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

  select o.slug into org_slug
  from public.organizations o
  where o.id = invite.organization_id;

  select p.email into caller_email
  from public.profiles p
  where p.id = caller;

  if caller_email is distinct from invite.email then
    raise exception 'Sign in with the invited email to accept.' using errcode = 'P0001';
  end if;

  if invite.role = 'parent' then
    if invite.student_profile_id is null then
      raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
    end if;

    insert into public.parent_student_links (parent_user_id, student_profile_id)
    values (caller, invite.student_profile_id)
    on conflict (parent_user_id, student_profile_id) do nothing;
  end if;

  select m.id, m.role into member_id, member_role
  from public.memberships m
  where m.organization_id = invite.organization_id
    and m.user_id = caller
    and m.status = 'active';

  if member_id is not null then
    if invite.role in ('owner', 'admin', 'instructor')
       and member_role = 'parent' then
      update public.memberships
      set role = invite.role
      where id = member_id;
    end if;

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

-- Keep PR #2 names so existing callers / docs still work.
create or replace function public.get_staff_invite(p_token text)
returns table (
  id bigint,
  organization_id bigint,
  organization_name text,
  organization_slug text,
  email text,
  role text,
  student_profile_id bigint,
  student_name text,
  accepted_at timestamptz,
  email_matches boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.get_invite(p_token);
$$;

create or replace function public.claim_staff_invite(p_token text)
returns text
language sql
security definer
set search_path = ''
as $$
  select public.claim_invite(p_token);
$$;

revoke all on function public.get_invite(text) from public, anon;
grant execute on function public.get_invite(text) to authenticated;

revoke all on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;

revoke all on function public.get_staff_invite(text) from public, anon;
grant execute on function public.get_staff_invite(text) to authenticated;

revoke all on function public.claim_staff_invite(text) from public, anon;
grant execute on function public.claim_staff_invite(text) to authenticated;

revoke all on function public.normalize_org_invite() from public, anon;
grant execute on function public.normalize_org_invite() to authenticated;
