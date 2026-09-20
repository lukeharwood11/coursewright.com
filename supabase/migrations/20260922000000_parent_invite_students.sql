-- One pending parent invite per (organization_id, email).
-- Extra students attach via admin_invite_students; claim links all of them.
-- Safe to re-run on DBs that already have the squashed schema (IF NOT EXISTS / OR REPLACE).

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.admin_invite_students (
  id bigserial primary key,
  invite_id bigint not null references public.admin_invites (id) on delete cascade,
  student_profile_id bigint not null references public.student_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint admin_invite_students_invite_student_key unique (invite_id, student_profile_id)
);

create index if not exists admin_invite_students_student_profile_id_idx
  on public.admin_invite_students (student_profile_id);
create index if not exists admin_invite_students_invite_id_idx
  on public.admin_invite_students (invite_id);

comment on table public.admin_invite_students is
  'Students attached to a parent AdminInvite. Claim links the parent to every attached student.';

-- Backfill anchor students before normalize triggers exist / while disabled.
insert into public.admin_invite_students (invite_id, student_profile_id)
select i.id, i.student_profile_id
from public.admin_invites i
where i.role = 'parent'
  and i.student_profile_id is not null
on conflict (invite_id, student_profile_id) do nothing;

-- ---------------------------------------------------------------------------
-- Merge duplicate pending parent invites (same org + email) into one row
-- ---------------------------------------------------------------------------

do $$
declare
  grp record;
  keeper_id bigint;
  dup_id bigint;
begin
  for grp in
    select organization_id, email
    from public.admin_invites
    where role = 'parent'
      and accepted_at is null
    group by organization_id, email
    having count(*) > 1
  loop
    select i.id into keeper_id
    from public.admin_invites i
    where i.organization_id = grp.organization_id
      and i.email = grp.email
      and i.role = 'parent'
      and i.accepted_at is null
    order by i.created_at asc, i.id asc
    limit 1;

    insert into public.admin_invite_students (invite_id, student_profile_id)
    select keeper_id, src.student_profile_id
    from (
      select distinct student_profile_id
      from public.admin_invites
      where organization_id = grp.organization_id
        and email = grp.email
        and role = 'parent'
        and accepted_at is null
        and student_profile_id is not null
      union
      select distinct ais.student_profile_id
      from public.admin_invite_students ais
      join public.admin_invites i on i.id = ais.invite_id
      where i.organization_id = grp.organization_id
        and i.email = grp.email
        and i.role = 'parent'
        and i.accepted_at is null
    ) src
    on conflict (invite_id, student_profile_id) do nothing;

    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'share_links'
    ) then
      update public.share_links sl
      set parent_invite_id = keeper_id
      where sl.parent_invite_id in (
        select i.id
        from public.admin_invites i
        where i.organization_id = grp.organization_id
          and i.email = grp.email
          and i.role = 'parent'
          and i.accepted_at is null
          and i.id <> keeper_id
      );
    end if;

    for dup_id in
      select i.id
      from public.admin_invites i
      where i.organization_id = grp.organization_id
        and i.email = grp.email
        and i.role = 'parent'
        and i.accepted_at is null
        and i.id <> keeper_id
    loop
      delete from public.admin_invites where id = dup_id;
    end loop;
  end loop;
end $$;

-- Pending uniqueness: one parent invite per org+email (was per org+email+student).
drop index if exists public.admin_invites_pending_parent_uidx;
create unique index admin_invites_pending_parent_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null and role = 'parent';

comment on table public.admin_invites is
  'SCHEMA.md AdminInvite — email-claim tokens for owner/admin/instructor/parent. Membership is created on claim. Parent invites are one pending row per (org, email); students attach via admin_invite_students.';

-- ---------------------------------------------------------------------------
-- Triggers / functions
-- ---------------------------------------------------------------------------

create or replace function private.attach_anchor_invite_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'parent' and new.student_profile_id is not null then
    insert into public.admin_invite_students (invite_id, student_profile_id)
    values (new.id, new.student_profile_id)
    on conflict (invite_id, student_profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists admin_invites_attach_anchor_student on public.admin_invites;
create trigger admin_invites_attach_anchor_student
after insert on public.admin_invites
for each row
execute function private.attach_anchor_invite_student();

revoke all on function private.attach_anchor_invite_student() from public, anon, authenticated;

create or replace function public.normalize_admin_invite_student()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  invite_row public.admin_invites%rowtype;
  student_org bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into invite_row
  from public.admin_invites
  where id = new.invite_id;

  if not found then
    raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
  end if;

  if invite_row.role is distinct from 'parent' then
    raise exception 'Only parent invites can attach students.' using errcode = 'P0001';
  end if;

  if invite_row.accepted_at is not null then
    raise exception 'This invite was already accepted.' using errcode = 'P0001';
  end if;

  if not private.is_org_staff(invite_row.organization_id) then
    raise exception 'Only staff can invite parents.' using errcode = '42501';
  end if;

  select sp.organization_id into student_org
  from public.student_profiles sp
  where sp.id = new.student_profile_id;

  if student_org is distinct from invite_row.organization_id then
    raise exception 'That student is not in this organization.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.parent_student_links psl
    join public.profiles p on p.id = psl.parent_user_id
    where psl.student_profile_id = new.student_profile_id
      and p.email = invite_row.email
  ) then
    raise exception 'That parent is already linked to this student.' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists admin_invite_students_normalize on public.admin_invite_students;
create trigger admin_invite_students_normalize
before insert on public.admin_invite_students
for each row
execute function public.normalize_admin_invite_student();

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

    if tg_op = 'INSERT' and exists (
      select 1
      from public.admin_invites i
      where i.organization_id = new.organization_id
        and i.email = new.email
        and i.role = 'parent'
        and i.accepted_at is null
    ) then
      raise exception 'That email already has a pending invite.' using errcode = 'P0001';
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

    if exists (
      select 1
      from public.admin_invite_students ais
      where ais.invite_id = invite.id
    ) then
      insert into public.parent_student_links (parent_user_id, student_profile_id)
      select caller, ais.student_profile_id
      from public.admin_invite_students ais
      where ais.invite_id = invite.id
      on conflict (parent_user_id, student_profile_id) do nothing;
    else
      insert into public.parent_student_links (parent_user_id, student_profile_id)
      values (caller, invite.student_profile_id)
      on conflict (parent_user_id, student_profile_id) do nothing;
    end if;
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.admin_invite_students enable row level security;
revoke all on table public.admin_invite_students from anon, authenticated;
grant select, insert, delete on table public.admin_invite_students to authenticated;
grant select, insert, update, delete on table public.admin_invite_students to service_role;

drop policy if exists admin_invite_students_select on public.admin_invite_students;
create policy admin_invite_students_select on public.admin_invite_students
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_invites i
      where i.id = invite_id
        and (
          (
            i.accepted_at is null
            and i.email = (select private.current_profile_email())
          )
          or (
            i.role = 'parent'
            and (select private.is_org_staff(i.organization_id))
          )
        )
    )
  );

drop policy if exists admin_invite_students_insert on public.admin_invite_students;
create policy admin_invite_students_insert on public.admin_invite_students
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_invites i
      where i.id = invite_id
        and i.role = 'parent'
        and i.accepted_at is null
        and (select private.is_org_staff(i.organization_id))
    )
  );

drop policy if exists admin_invite_students_delete on public.admin_invite_students;
create policy admin_invite_students_delete on public.admin_invite_students
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_invites i
      where i.id = invite_id
        and i.role = 'parent'
        and i.accepted_at is null
        and (select private.is_org_staff(i.organization_id))
    )
  );
