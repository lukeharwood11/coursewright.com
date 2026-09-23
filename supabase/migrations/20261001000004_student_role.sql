-- Dedicated student membership. Claim sets student_profiles.user_id (not
-- parent_student_links). Course access matches parents: active enrollment in
-- an active published course, plus an active org membership.

alter table public.memberships drop constraint memberships_role_chk;
alter table public.memberships add constraint memberships_role_chk
  check (role in ('owner', 'admin', 'instructor', 'parent', 'student'));

alter table public.admin_invites drop constraint admin_invites_role_check;
alter table public.admin_invites add constraint admin_invites_role_check
  check (role in ('owner', 'admin', 'instructor', 'parent', 'student'));

alter table public.admin_invites drop constraint admin_invites_parent_student_chk;
alter table public.admin_invites add constraint admin_invites_parent_student_chk
  check (
    (role in ('parent', 'student') and student_profile_id is not null)
    or (role in ('owner', 'admin', 'instructor') and student_profile_id is null)
  );

create unique index admin_invites_pending_student_uidx
  on public.admin_invites (organization_id, email)
  where accepted_at is null and role = 'student';

create unique index student_profiles_org_user_uidx
  on public.student_profiles (organization_id, user_id)
  where user_id is not null;

comment on column public.student_profiles.student_email is
  'Optional student contact email. Invite uses admin_invites.role = student.';
comment on column public.student_profiles.user_id is
  'Set when a student invite is claimed. One account per profile in an org.';

-- ---------------------------------------------------------------------------
-- Demote guards
-- ---------------------------------------------------------------------------

create or replace function private.guard_membership_parent_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.role = 'parent'
     and old.role is distinct from 'parent' then
    if new.user_id is null
       or not exists (
         select 1
         from public.parent_student_links psl
         join public.student_profiles sp
           on sp.id = psl.student_profile_id
         where psl.parent_user_id = new.user_id
           and sp.organization_id = new.organization_id
       ) then
      raise exception
        'That person can only become a parent if they are linked to a student in this organization.'
        using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'UPDATE'
     and new.role = 'student'
     and old.role is distinct from 'student' then
    if new.user_id is null
       or not exists (
         select 1
         from public.student_profiles sp
         where sp.user_id = new.user_id
           and sp.organization_id = new.organization_id
       ) then
      raise exception
        'That person can only become a student if their account is linked to a student profile in this organization.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invite normalize + claim
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
        and m.role in ('parent', 'student')
        and p.email = new.email
    ) then
      raise exception 'That person already has a family role in this organization.'
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

    if exists (
      select 1
      from public.memberships m
      where m.organization_id = invite.organization_id
        and m.user_id = caller
        and m.status = 'active'
        and m.role = 'parent'
    ) then
      raise exception 'This account is already a parent in this organization.'
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
    if invite.role in ('owner', 'admin', 'instructor')
       and member_role in ('parent', 'student') then
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
-- Student access helpers
-- ---------------------------------------------------------------------------

create or replace function private.student_owns_profile(p_student_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.student_profiles sp
    where sp.id = p_student_id
      and sp.user_id = (select auth.uid())
  );
$$;

create or replace function private.student_linked_to_class(p_class_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members cm
    join public.student_profiles sp
      on sp.id = cm.student_profile_id
     and sp.user_id = (select auth.uid())
    where cm.class_id = p_class_id
  );
$$;

create or replace function private.student_can_view_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses c
    join public.enrollments e
      on e.course_id = c.id
     and e.status = 'active'
    join public.student_profiles sp
      on sp.id = e.student_profile_id
     and sp.user_id = (select auth.uid())
    join public.memberships m
      on m.organization_id = c.organization_id
     and m.user_id = (select auth.uid())
     and m.status = 'active'
    where c.id = p_course_id
      and c.status = 'active'
      and c.visibility = 'published'
  );
$$;

create or replace function private.can_view_course(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_manage_course(p_course_id)
      or private.parent_can_view_course(p_course_id)
      or private.student_can_view_course(p_course_id);
$$;

create or replace function private.parent_can_view_material(p_material_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.id = p_material_id
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and (
        private.parent_can_view_course(m.course_id)
        or private.student_can_view_course(m.course_id)
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
     and m.role = 'parent'
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
     and m.role = 'student'
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
          m.role = 'parent'
          and (
            (p_audience = 'course' and private.parent_can_view_course(p_course_id))
            or (p_audience = 'class' and private.parent_linked_to_class(p_class_id))
          )
        )
        or (
          m.role = 'student'
          and (
            (p_audience = 'course' and private.student_can_view_course(p_course_id))
            or (p_audience = 'class' and private.student_linked_to_class(p_class_id))
          )
        )
      )
  );
$$;

create or replace function private.can_start_discussion(
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
  select
    case p_audience
      when 'course' then
        p_course_id is not null
        and exists (
          select 1
          from public.courses c
          where c.id = p_course_id
            and c.organization_id = p_org_id
        )
        and (
          private.can_manage_course(p_course_id)
          or private.parent_can_view_course(p_course_id)
          or private.student_can_view_course(p_course_id)
        )
      when 'class' then
        p_class_id is not null
        and exists (
          select 1
          from public.classes c
          where c.id = p_class_id
            and c.organization_id = p_org_id
            and c.deleted_at is null
        )
        and (
          private.is_org_staff(p_org_id)
          or private.parent_linked_to_class(p_class_id)
          or private.student_linked_to_class(p_class_id)
        )
      else false
    end;
$$;

create or replace function private.parent_can_view_event(p_event_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and e.deleted_at is null
      and (
        (
          e.audience = 'course'
          and exists (
            select 1
            from unnest(e.course_ids) as cid
            where private.parent_can_view_course(cid)
               or private.student_can_view_course(cid)
          )
        )
        or (
          e.audience = 'class'
          and exists (
            select 1
            from unnest(e.class_ids) as cid
            where private.parent_linked_to_class(cid)
               or private.student_linked_to_class(cid)
          )
        )
        or (
          e.audience = 'organization'
          and private.is_org_member(e.organization_id)
        )
      )
  );
$$;

create or replace function private.parent_can_view_file(p_file_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.file_id = p_file_id
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and (
        private.parent_can_view_course(m.course_id)
        or private.student_can_view_course(m.course_id)
      )
  )
  or exists (
    select 1
    from public.blocks b
    join public.materials m on m.id = b.material_id
    where b.file_id = p_file_id
      and b.deleted_at is null
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and (
        private.parent_can_view_course(m.course_id)
        or private.student_can_view_course(m.course_id)
      )
  )
  or exists (
    select 1
    from public.discussion_message_attachments a
    join public.discussion_messages msg on msg.id = a.message_id
    join public.discussions d on d.id = msg.discussion_id
    where a.file_id = p_file_id
      and a.kind = 'file'
      and msg.deleted_at is null
      and d.deleted_at is null
      and private.parent_can_view_discussion(d.id)
  )
  or exists (
    select 1
    from public.org_resource_items i
    where i.file_id = p_file_id
      and i.archived_at is null
      and private.can_view_org_resource_item(i.id)
  )
  or exists (
    select 1
    from public.org_resource_blocks b
    join public.org_resource_items i on i.id = b.item_id
    where b.file_id = p_file_id
      and b.deleted_at is null
      and i.archived_at is null
      and private.can_view_org_resource_item(i.id)
  )
  or exists (
    select 1
    from public.event_blocks b
    join public.events e on e.id = b.event_id
    where b.deleted_at is null
      and e.deleted_at is null
      and private.parent_can_view_event(e.id)
      and (
        b.file_id = p_file_id
        or b.body::text ~ (
          '"fileId"[[:space:]]*:[[:space:]]*' || p_file_id::text || '([^0-9]|$)'
        )
      )
  );
$$;

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
      and m.role in ('parent', 'student')
      and m.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Discussion audience includes the student account
-- ---------------------------------------------------------------------------

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
      and m.role = 'parent'
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
      and m.role = 'student'
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
-- Announcement Activity includes the student account
-- ---------------------------------------------------------------------------

create or replace function public.notify_announcement(
  p_announcement_id bigint,
  p_actor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ann record;
  actor uuid;
  preview text;
  audience_label text;
begin
  if p_announcement_id is null then
    return;
  end if;

  select
    a.id,
    a.organization_id,
    a.audience,
    a.course_ids,
    a.class_ids,
    a.student_profile_ids,
    a.title,
    a.body,
    a.created_by,
    a.deleted_at
  into ann
  from public.announcements a
  where a.id = p_announcement_id;

  if ann.id is null or ann.deleted_at is not null then
    return;
  end if;

  actor := coalesce(p_actor_id, ann.created_by);

  preview := private.discussion_message_preview(ann.body);
  if preview = '' then
    preview := 'New announcement.';
  end if;

  select coalesce(left(string_agg(names.label, ', ' order by names.label), 160), '')
  into audience_label
  from (
    select c.title as label
    from public.courses c
    where ann.audience = 'course'
      and c.id = any(ann.course_ids)
    union all
    select c.title as label
    from public.classes c
    where ann.audience = 'class'
      and c.id = any(ann.class_ids)
    union all
    select s.name as label
    from public.student_profiles s
    where ann.audience = 'student'
      and s.id = any(ann.student_profile_ids)
  ) as names
  where nullif(btrim(names.label), '') is not null;

  perform set_config('coursewright.notification_write', '1', true);

  insert into public.notifications (
    organization_id,
    user_id,
    kind,
    announcement_id,
    actor_id,
    title,
    preview,
    audience_label
  )
  select
    ann.organization_id,
    recipient.user_id,
    'announcement',
    ann.id,
    actor,
    ann.title,
    preview,
    audience_label
  from (
    select distinct psl.parent_user_id as user_id
    from public.parent_student_links psl
    join public.memberships m
      on m.user_id = psl.parent_user_id
     and m.organization_id = ann.organization_id
     and m.status = 'active'
    where psl.parent_user_id is distinct from actor
      and psl.student_profile_id in (
        select e.student_profile_id
        from public.enrollments e
        where ann.audience = 'course'
          and e.status = 'active'
          and e.course_id = any(ann.course_ids)
        union
        select cm.student_profile_id
        from public.class_members cm
        where ann.audience = 'class'
          and cm.class_id = any(ann.class_ids)
        union
        select sid
        from unnest(ann.student_profile_ids) as sid
        where ann.audience = 'student'
      )
    union
    select distinct sp.user_id
    from public.student_profiles sp
    join public.memberships m
      on m.user_id = sp.user_id
     and m.organization_id = ann.organization_id
     and m.status = 'active'
    where sp.organization_id = ann.organization_id
      and sp.user_id is not null
      and sp.user_id is distinct from actor
      and sp.id in (
        select e.student_profile_id
        from public.enrollments e
        where ann.audience = 'course'
          and e.status = 'active'
          and e.course_id = any(ann.course_ids)
        union
        select cm.student_profile_id
        from public.class_members cm
        where ann.audience = 'class'
          and cm.class_id = any(ann.class_ids)
        union
        select sid
        from unnest(ann.student_profile_ids) as sid
        where ann.audience = 'student'
      )
  ) as recipient
  on conflict (user_id, announcement_id)
    where (kind = 'announcement' and announcement_id is not null)
  do update
  set
    actor_id = excluded.actor_id,
    title = excluded.title,
    preview = excluded.preview,
    audience_label = excluded.audience_label,
    created_at = now(),
    read_at = null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Extra SELECT policies (permissive policies OR together)
-- ---------------------------------------------------------------------------

create policy courses_student_select on public.courses
for select to authenticated
using ((select private.student_can_view_course(id)));

create policy units_student_select on public.units
for select to authenticated
using (
  course_id is not null
  and deleted_at is null
  and (select private.student_can_view_course(course_id))
);

create policy lesson_plans_student_select on public.lesson_plans
for select to authenticated
using (
  deleted_at is null
  and visibility = 'published'
  and (select private.student_can_view_course(course_id))
);

create policy enrollments_student_select on public.enrollments
for select to authenticated
using ((select private.student_owns_profile(student_profile_id)));

create policy student_profiles_self_select on public.student_profiles
for select to authenticated
using (user_id = (select auth.uid()));

create policy classes_student_select on public.classes
for select to authenticated
using (
  deleted_at is null
  and (select private.student_linked_to_class(id))
);

create policy class_members_student_select on public.class_members
for select to authenticated
using ((select private.student_owns_profile(student_profile_id)));

create policy admin_invites_student_select on public.admin_invites
for select to authenticated
using (
  role = 'student'
  and (select private.is_org_staff(organization_id))
);

create policy admin_invites_student_insert on public.admin_invites
for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and role = 'student'
  and (select private.is_org_staff(organization_id))
);

create policy admin_invites_student_delete on public.admin_invites
for delete to authenticated
using (
  accepted_at is null
  and role = 'student'
  and (select private.is_org_staff(organization_id))
);

comment on column public.courses.visibility is
  'published = enrolled parents and student accounts; unpublished = instructors/admins only';

grant execute on function private.student_owns_profile(bigint) to authenticated, service_role;
grant execute on function private.student_linked_to_class(bigint) to authenticated, service_role;
grant execute on function private.student_can_view_course(bigint) to authenticated, service_role;
