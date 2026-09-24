-- Exclusive org roles (owner, admin, instructor) are memberships.role.
-- Parent and student are additive flags on that same row so they survive
-- when the exclusive role changes. Course edit access requires an active
-- staff membership; leftover course_instructors rows do not.

alter table public.memberships
  add column is_parent boolean not null default false,
  add column is_student boolean not null default false;

comment on column public.memberships.role is
  'Governing role. Exclusive when owner, admin, or instructor. Otherwise parent or student.';
comment on column public.memberships.is_parent is
  'Additive parent. Stays set when an exclusive role is added or replaced.';
comment on column public.memberships.is_student is
  'Additive student account. Stays set when an exclusive role is added or replaced.';

update public.memberships m
set is_parent = true
where m.role = 'parent'
   or exists (
     select 1
     from public.parent_student_links psl
     join public.student_profiles sp on sp.id = psl.student_profile_id
     where psl.parent_user_id = m.user_id
       and sp.organization_id = m.organization_id
   );

update public.memberships m
set is_student = true
where m.role = 'student'
   or exists (
     select 1
     from public.student_profiles sp
     where sp.user_id = m.user_id
       and sp.organization_id = m.organization_id
   );

-- ---------------------------------------------------------------------------
-- Keep additive flags. Block collaborator-list promotion of pure students.
-- claim_invite and profile delete set coursewright.allow_student_role_change.
-- ---------------------------------------------------------------------------

create or replace function private.memberships_preserve_additive_roles()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and old.role = 'student'
     and new.role is distinct from old.role
     and new.role in ('owner', 'admin', 'instructor', 'parent')
     and coalesce(current_setting('coursewright.allow_student_role_change', true), '') <> '1'
  then
    raise exception 'Students can''t be changed from the collaborators list.'
      using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if old.is_parent then
      new.is_parent := true;
    end if;
    if old.is_student then
      new.is_student := true;
    end if;
  end if;

  if new.role = 'parent' then
    new.is_parent := true;
  end if;
  if new.role = 'student' then
    new.is_student := true;
  end if;

  if tg_op = 'INSERT' and new.user_id is not null then
    if exists (
      select 1
      from public.parent_student_links psl
      join public.student_profiles sp on sp.id = psl.student_profile_id
      where psl.parent_user_id = new.user_id
        and sp.organization_id = new.organization_id
    ) then
      new.is_parent := true;
    end if;
    if exists (
      select 1
      from public.student_profiles sp
      where sp.user_id = new.user_id
        and sp.organization_id = new.organization_id
    ) then
      new.is_student := true;
    end if;
  end if;

  return new;
end;
$$;

create trigger memberships_preserve_additive_roles
before insert or update on public.memberships
for each row execute function private.memberships_preserve_additive_roles();

alter table public.memberships
  add constraint memberships_parent_flag_chk
    check (role <> 'parent' or is_parent),
  add constraint memberships_student_flag_chk
    check (role <> 'student' or is_student);

-- ---------------------------------------------------------------------------
-- Flags follow the existing link tables (not a second access gate).
-- ---------------------------------------------------------------------------

create or replace function private.sync_membership_parent_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_org bigint;
  profile_id bigint;
begin
  profile_id := coalesce(new.student_profile_id, old.student_profile_id);
  target_user := coalesce(new.parent_user_id, old.parent_user_id);

  select sp.organization_id into target_org
  from public.student_profiles sp
  where sp.id = profile_id;

  if target_user is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  -- Profile may already be gone when a link cascades from student delete.
  update public.memberships m
  set is_parent = (
    m.role = 'parent'
    or exists (
      select 1
      from public.parent_student_links psl
      join public.student_profiles sp on sp.id = psl.student_profile_id
      where psl.parent_user_id = m.user_id
        and sp.organization_id = m.organization_id
    )
  )
  where m.user_id = target_user
    and (target_org is null or m.organization_id = target_org);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger parent_student_links_sync_parent_flag
after insert or update or delete on public.parent_student_links
for each row execute function private.sync_membership_parent_flag();

create or replace function private.sync_membership_student_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_org bigint;
begin
  if tg_op = 'UPDATE' and new.user_id is not distinct from old.user_id
     and new.organization_id is not distinct from old.organization_id then
    return new;
  end if;

  if tg_op <> 'INSERT' and old.user_id is not null then
    target_user := old.user_id;
    target_org := old.organization_id;
    update public.memberships m
    set is_student = (
      m.role = 'student'
      or exists (
        select 1
        from public.student_profiles sp
        where sp.user_id = m.user_id
          and sp.organization_id = m.organization_id
      )
    )
    where m.user_id = target_user
      and m.organization_id = target_org;
  end if;

  if tg_op <> 'DELETE' and new.user_id is not null then
    target_user := new.user_id;
    target_org := new.organization_id;
    update public.memberships m
    set is_student = (
      m.role = 'student'
      or exists (
        select 1
        from public.student_profiles sp
        where sp.user_id = m.user_id
          and sp.organization_id = m.organization_id
      )
    )
    where m.user_id = target_user
      and m.organization_id = target_org;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger student_profiles_sync_student_flag
after insert or update or delete on public.student_profiles
for each row execute function private.sync_membership_student_flag();

create or replace function private.remove_student_account_on_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.user_id is not null then
    perform set_config('coursewright.allow_student_role_change', '1', true);

    update public.memberships
    set role = 'parent'
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role = 'student'
      and is_parent;

    update public.memberships
    set is_student = false
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role <> 'student';

    delete from public.memberships
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role = 'student'
      and not is_parent;
  end if;
  return old;
end;
$$;

-- ---------------------------------------------------------------------------
-- Course manage access: active staff membership, and drop stale instructor rows
-- ---------------------------------------------------------------------------

create or replace function private.is_course_instructor(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_instructors ci
    join public.courses c on c.id = ci.course_id
    join public.memberships m
      on m.organization_id = c.organization_id
     and m.user_id = ci.user_id
     and m.status = 'active'
     and m.role in ('owner', 'admin', 'instructor')
    where ci.course_id = p_course_id
      and ci.user_id = (select auth.uid())
  );
$$;

create or replace function private.clear_course_instructors_on_membership_loss()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lost boolean;
begin
  if tg_op = 'DELETE' then
    lost := old.user_id is not null
      and old.role in ('owner', 'admin', 'instructor')
      and old.status = 'active';
    if lost then
      delete from public.course_instructors ci
      using public.courses c
      where ci.course_id = c.id
        and c.organization_id = old.organization_id
        and ci.user_id = old.user_id;
    end if;
    return old;
  end if;

  lost := old.user_id is not null
    and old.role in ('owner', 'admin', 'instructor')
    and old.status = 'active'
    and (
      new.status is distinct from 'active'
      or new.role not in ('owner', 'admin', 'instructor')
      or new.user_id is distinct from old.user_id
      or new.organization_id is distinct from old.organization_id
    );

  if lost then
    delete from public.course_instructors ci
    using public.courses c
    where ci.course_id = c.id
      and c.organization_id = old.organization_id
      and ci.user_id = old.user_id;
  end if;

  return new;
end;
$$;

create trigger memberships_clear_course_instructors
after update or delete on public.memberships
for each row execute function private.clear_course_instructors_on_membership_loss();

-- ---------------------------------------------------------------------------
-- Family checks honor additive flags while an exclusive role is in `role`
-- ---------------------------------------------------------------------------

create or replace function private.is_org_parent_role(p_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and (
        m.role in ('parent', 'student')
        or m.is_parent
        or m.is_student
      )
  );
$$;

create or replace function private.org_resource_audience_allows_read(
  p_org_id bigint,
  p_parents_can_view boolean,
  p_students_can_view boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      p_parents_can_view
      and exists (
        select 1
        from public.memberships m
        where m.organization_id = p_org_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and (m.role = 'parent' or m.is_parent)
      )
    )
    or (
      p_students_can_view
      and exists (
        select 1
        from public.memberships m
        where m.organization_id = p_org_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and (m.role = 'student' or m.is_student)
      )
    );
$$;

create or replace function private.parent_can_view_announcement(p_announcement_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.announcements a
    join public.memberships m
      on m.organization_id = a.organization_id
     and m.user_id = (select auth.uid())
     and (m.role = 'parent' or m.is_parent)
     and m.status = 'active'
    where a.id = p_announcement_id
      and (
        (
          a.audience = 'course'
          and exists (
            select 1
            from unnest(a.course_ids) as cid
            where private.parent_can_view_course(cid)
          )
        )
        or (
          a.audience = 'class'
          and exists (
            select 1
            from unnest(a.class_ids) as cid
            where private.parent_linked_to_class(cid)
              and exists (
                select 1
                from public.classes c
                where c.id = cid
                  and c.organization_id = a.organization_id
                  and c.deleted_at is null
              )
          )
        )
        or (
          a.audience = 'student'
          and exists (
            select 1
            from unnest(a.student_profile_ids) as sid
            where private.parent_linked_to_student(sid)
          )
        )
      )
  )
  or exists (
    select 1
    from public.announcements a
    join public.memberships m
      on m.organization_id = a.organization_id
     and m.user_id = (select auth.uid())
     and (m.role = 'student' or m.is_student)
     and m.status = 'active'
    where a.id = p_announcement_id
      and (
        (
          a.audience = 'course'
          and exists (
            select 1
            from unnest(a.course_ids) as cid
            where private.student_can_view_course(cid)
          )
        )
        or (
          a.audience = 'class'
          and exists (
            select 1
            from unnest(a.class_ids) as cid
            where private.student_linked_to_class(cid)
              and exists (
                select 1
                from public.classes c
                where c.id = cid
                  and c.organization_id = a.organization_id
                  and c.deleted_at is null
              )
          )
        )
        or (
          a.audience = 'student'
          and exists (
            select 1
            from unnest(a.student_profile_ids) as sid
            where private.student_owns_profile(sid)
          )
        )
      )
  );
$$;

create or replace function private.parent_can_view_discussion(
  p_org_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and (
        (
          (m.role = 'parent' or m.is_parent)
          and (
            (p_audience = 'course' and private.parent_can_view_course(p_course_id))
            or (p_audience = 'class' and private.parent_linked_to_class(p_class_id))
          )
        )
        or (
          (m.role = 'student' or m.is_student)
          and (
            (p_audience = 'course' and private.student_can_view_course(p_course_id))
            or (p_audience = 'class' and private.student_linked_to_class(p_class_id))
          )
        )
      )
  );
$$;

create or replace function private.discussion_audience_people(
  p_organization_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint
)
returns table (
  user_id uuid,
  name text,
  role text
)
language sql
stable
security definer
set search_path = ''
as $$
  with staff as (
    select
      m.user_id,
      coalesce(nullif(trim(p.name), ''), p.email, 'Someone') as display_name,
      m.role
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.organization_id = p_organization_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'instructor')
  ),
  parents as (
    select distinct
      m.user_id,
      coalesce(nullif(trim(p.name), ''), p.email, 'Someone') as display_name,
      m.role
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.organization_id = p_organization_id
      and m.status = 'active'
      and m.role not in ('owner', 'admin', 'instructor')
      and (m.role = 'parent' or m.is_parent)
      and (
        (
          p_audience = 'course'
          and exists (
            select 1
            from public.courses c
            join public.enrollments e
              on e.course_id = c.id
             and e.status = 'active'
            join public.parent_student_links psl
              on psl.student_profile_id = e.student_profile_id
             and psl.parent_user_id = m.user_id
            where c.id = p_course_id
              and c.status = 'active'
              and c.visibility = 'published'
          )
        )
        or (
          p_audience = 'class'
          and exists (
            select 1
            from public.class_members cm
            join public.parent_student_links psl
              on psl.student_profile_id = cm.student_profile_id
             and psl.parent_user_id = m.user_id
            where cm.class_id = p_class_id
          )
        )
      )
  ),
  students as (
    select distinct
      m.user_id,
      coalesce(nullif(trim(p.name), ''), p.email, 'Someone') as display_name,
      m.role
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    join public.student_profiles sp
      on sp.user_id = m.user_id
     and sp.organization_id = m.organization_id
    where m.organization_id = p_organization_id
      and m.status = 'active'
      and m.role not in ('owner', 'admin', 'instructor')
      and not (m.role = 'parent' or m.is_parent)
      and (m.role = 'student' or m.is_student)
      and (
        (
          p_audience = 'course'
          and exists (
            select 1
            from public.courses c
            join public.enrollments e
              on e.course_id = c.id
             and e.status = 'active'
             and e.student_profile_id = sp.id
            where c.id = p_course_id
              and c.status = 'active'
              and c.visibility = 'published'
          )
        )
        or (
          p_audience = 'class'
          and exists (
            select 1
            from public.class_members cm
            where cm.class_id = p_class_id
              and cm.student_profile_id = sp.id
          )
        )
      )
  )
  select s.user_id, s.display_name, s.role
  from (
    select * from staff
    union
    select * from parents
    union
    select * from students
  ) s
  order by lower(s.display_name), s.role;
$$;

-- ---------------------------------------------------------------------------
-- Invites: parent and student stack. Staff claim keeps the additive flags.
-- ---------------------------------------------------------------------------

create or replace function public.normalize_org_invite()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  student_org bigint;
  linked_user uuid;
begin
  new.email := lower(trim(new.email));
  if new.email is null or new.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.' using errcode = 'P0001';
  end if;

  if new.role not in ('owner', 'admin', 'instructor', 'parent', 'student') then
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
  elsif new.role = 'student' then
    if new.student_profile_id is null then
      raise exception 'Choose a student to invite.' using errcode = 'P0001';
    end if;

    if not private.is_org_staff(new.organization_id) then
      raise exception 'Only staff can invite students.' using errcode = '42501';
    end if;

    select sp.organization_id, sp.user_id
      into student_org, linked_user
    from public.student_profiles sp
    where sp.id = new.student_profile_id;

    if student_org is distinct from new.organization_id then
      raise exception 'That student is not in this organization.' using errcode = 'P0001';
    end if;

    if linked_user is not null then
      raise exception 'This student already has an account.' using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      where m.organization_id = new.organization_id
        and m.status = 'active'
        and (m.role = 'student' or m.is_student)
        and p.email = new.email
    ) then
      raise exception 'That person already has a student account in this organization.'
        using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.admin_invites i
      where i.student_profile_id = new.student_profile_id
        and i.role = 'student'
        and i.accepted_at is null
        and (tg_op = 'INSERT' or i.id is distinct from new.id)
    ) then
      raise exception 'This student already has a pending invite.' using errcode = 'P0001';
    end if;

    if tg_op = 'INSERT' and exists (
      select 1
      from public.admin_invites i
      where i.organization_id = new.organization_id
        and i.email = new.email
        and i.role = 'student'
        and i.accepted_at is null
    ) then
      raise exception 'That email already has a pending student invite.' using errcode = 'P0001';
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
  existing_user uuid;
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
  elsif invite.role = 'student' then
    if invite.student_profile_id is null then
      raise exception 'This invite is missing or no longer valid.' using errcode = 'P0002';
    end if;

    select sp.user_id into existing_user
    from public.student_profiles sp
    where sp.id = invite.student_profile_id
    for update;

    if existing_user is not null and existing_user is distinct from caller then
      raise exception 'This student already has an account.' using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.student_profiles sp
      where sp.organization_id = invite.organization_id
        and sp.user_id = caller
        and sp.id is distinct from invite.student_profile_id
    ) then
      raise exception 'This account is already linked to another student in this organization.'
        using errcode = 'P0001';
    end if;

    update public.student_profiles
    set user_id = caller
    where id = invite.student_profile_id
      and (user_id is null or user_id = caller);
  end if;

  select m.id, m.role into member_id, member_role
  from public.memberships m
  where m.organization_id = invite.organization_id
    and m.user_id = caller
    and m.status = 'active';

  if member_id is not null then
    perform set_config('coursewright.allow_student_role_change', '1', true);

    if invite.role in ('owner', 'admin', 'instructor')
       and member_role in ('parent', 'student') then
      update public.memberships
      set role = invite.role
      where id = member_id;
    elsif invite.role = 'parent' then
      update public.memberships
      set
        is_parent = true,
        role = case
          when role in ('owner', 'admin', 'instructor') then role
          else 'parent'
        end
      where id = member_id;
    elsif invite.role = 'student' then
      update public.memberships
      set is_student = true
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

-- Changing a claimed student email revokes the student account. A parent
-- membership and an exclusive staff role stay; only the student flag ends.
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

  delete from public.admin_invites
  where student_profile_id = old.id
    and role = 'student'
    and accepted_at is null;

  if old.user_id is not null then
    perform set_config('coursewright.allow_student_role_change', '1', true);

    update public.memberships
    set role = 'parent'
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role = 'student'
      and is_parent;

    update public.memberships
    set is_student = false
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role <> 'student';

    delete from public.memberships
    where organization_id = old.organization_id
      and user_id = old.user_id
      and role = 'student'
      and not is_parent;

    new.user_id := null;
  elsif pending_invited_by is not null and new.student_email is not null then
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
