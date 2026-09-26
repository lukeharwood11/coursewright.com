-- Organization-wide discussions (like events) and family_audience
-- (parents / students / both) so threads can exclude student accounts.

alter table public.discussions
  add column if not exists family_audience text not null default 'both';

alter table public.discussions
  drop constraint if exists discussions_audience_chk;

alter table public.discussions
  add constraint discussions_audience_chk
  check (audience in ('course', 'class', 'organization'));

alter table public.discussions
  drop constraint if exists discussions_audience_target_chk;

alter table public.discussions
  add constraint discussions_audience_target_chk
  check (
    (
      audience = 'course'
      and course_id is not null
      and class_id is null
    )
    or (
      audience = 'class'
      and class_id is not null
      and course_id is null
    )
    or (
      audience = 'organization'
      and course_id is null
      and class_id is null
    )
  );

alter table public.discussions
  drop constraint if exists discussions_family_audience_chk;

alter table public.discussions
  add constraint discussions_family_audience_chk
  check (family_audience in ('parents', 'students', 'both'));

comment on column public.discussions.family_audience is
  'Which family roles can see and post: parents, students, or both. Staff always see org threads.';

create index if not exists discussions_organization_audience_idx
  on public.discussions (organization_id, last_message_at desc)
  where deleted_at is null and audience = 'organization';

-- ---------------------------------------------------------------------------
-- Visibility and audience members
-- ---------------------------------------------------------------------------

create or replace function private.parent_can_view_discussion(
  p_org_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint,
  p_family_audience text default 'both'
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
          and p_family_audience in ('parents', 'both')
          and (
            (
              p_audience = 'course'
              and private.parent_can_view_course(p_course_id)
            )
            or (
              p_audience = 'class'
              and private.parent_linked_to_class(p_class_id)
            )
            or p_audience = 'organization'
          )
        )
        or (
          (m.role = 'student' or m.is_student)
          and p_family_audience in ('students', 'both')
          and (
            (
              p_audience = 'course'
              and private.student_can_view_course(p_course_id)
            )
            or (
              p_audience = 'class'
              and private.student_linked_to_class(p_class_id)
            )
            or p_audience = 'organization'
          )
        )
      )
  );
$$;

create or replace function private.parent_can_view_discussion(p_discussion_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.discussions d
    where d.id = p_discussion_id
      and private.parent_can_view_discussion(
        d.organization_id,
        d.audience,
        d.course_id,
        d.class_id,
        d.family_audience
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
    not exists (
      select 1
      from public.memberships m
      where m.organization_id = p_org_id
        and m.user_id = (select auth.uid())
        and m.role = 'observer'
        and m.status = 'active'
    )
    and case p_audience
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
      when 'organization' then
        nullif(p_course_id, 0) is null
        and nullif(p_class_id, 0) is null
        and (select private.is_org_staff(p_org_id))
      else false
    end;
$$;

create or replace function private.discussion_audience_people(
  p_organization_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint,
  p_family_audience text default 'both'
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
      and m.role in ('owner', 'admin', 'instructor', 'observer')
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
      and m.role not in ('owner', 'admin', 'instructor', 'observer')
      and (m.role = 'parent' or m.is_parent)
      and p_family_audience in ('parents', 'both')
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
        or p_audience = 'organization'
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
      and m.role not in ('owner', 'admin', 'instructor', 'observer')
      and not (m.role = 'parent' or m.is_parent)
      and (m.role = 'student' or m.is_student)
      and p_family_audience in ('students', 'both')
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
        or p_audience = 'organization'
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

create or replace function private.is_discussion_member(
  p_discussion_id bigint,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.discussions d
    join lateral private.discussion_audience_people(
      d.organization_id,
      d.audience,
      d.course_id,
      d.class_id,
      d.family_audience
    ) people on people.user_id = p_user_id
    where d.id = p_discussion_id
      and d.deleted_at is null
  );
$$;

create or replace function public.list_discussion_members(p_discussion_id bigint)
returns table (
  user_id uuid,
  name text,
  role text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  disc record;
begin
  if p_discussion_id is null then
    raise exception 'That discussion couldn’t be found.';
  end if;

  if not private.can_see_discussion(p_discussion_id) then
    raise exception 'You can’t see this discussion.';
  end if;

  select
    d.organization_id,
    d.audience,
    d.course_id,
    d.class_id,
    d.family_audience
  into disc
  from public.discussions d
  where d.id = p_discussion_id;

  if disc.organization_id is null then
    raise exception 'That discussion couldn’t be found.';
  end if;

  return query
  select people.user_id, people.name, people.role
  from private.discussion_audience_people(
    disc.organization_id,
    disc.audience,
    disc.course_id,
    disc.class_id,
    disc.family_audience
  ) as people;
end;
$$;

drop function if exists public.list_discussion_audience_members(bigint, text, bigint, bigint);

create or replace function public.list_discussion_audience_members(
  p_organization_id bigint,
  p_audience text,
  p_course_id bigint,
  p_class_id bigint,
  p_family_audience text default 'both'
)
returns table (
  user_id uuid,
  name text,
  role text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_course_id bigint := nullif(p_course_id, 0);
  v_class_id bigint := nullif(p_class_id, 0);
begin
  if not private.can_start_discussion(
    p_organization_id,
    p_audience,
    v_course_id,
    v_class_id
  ) then
    raise exception 'You can’t start a discussion for that audience.';
  end if;

  return query
  select people.user_id, people.name, people.role
  from private.discussion_audience_people(
    p_organization_id,
    p_audience,
    v_course_id,
    v_class_id,
    p_family_audience
  ) as people;
end;
$$;

grant execute on function public.list_discussion_audience_members(
  bigint, text, bigint, bigint, text
) to authenticated, service_role;

comment on function public.list_discussion_audience_members(
  bigint, text, bigint, bigint, text
) is
  'People who would be on a discussion for this audience; caller must be allowed to start that thread.';

drop policy if exists discussions_select on public.discussions;
create policy discussions_select on public.discussions
for select to authenticated
using (
  (select private.can_browse_as_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_discussion(
      organization_id,
      audience,
      course_id,
      class_id,
      family_audience
    ))
  )
);

-- ---------------------------------------------------------------------------
-- Activity fan-out for organization threads
-- ---------------------------------------------------------------------------

create or replace function private.notify_discussion_message_row(
  p_message_id bigint,
  p_discussion_id bigint,
  p_author_id uuid,
  p_body text,
  p_deleted_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  disc record;
  preview text;
  audience_label text;
  is_opening boolean;
  notify_everyone boolean;
begin
  if p_deleted_at is not null then
    return;
  end if;

  select
    d.id,
    d.organization_id,
    d.audience,
    d.course_id,
    d.class_id,
    d.family_audience,
    d.title,
    d.created_by,
    d.notify_all,
    d.deleted_at
  into disc
  from public.discussions d
  where d.id = p_discussion_id;

  if disc.id is null or disc.deleted_at is not null then
    return;
  end if;

  preview := private.discussion_message_preview(p_body);
  if preview = '' then
    preview := 'Posted in this discussion.';
  end if;

  if disc.audience = 'course' then
    select c.title into audience_label
    from public.courses c
    where c.id = disc.course_id;
  elsif disc.audience = 'class' then
    select c.title into audience_label
    from public.classes c
    where c.id = disc.class_id;
  else
    select o.name into audience_label
    from public.organizations o
    where o.id = disc.organization_id;
  end if;
  audience_label := coalesce(nullif(btrim(audience_label), ''), '');

  is_opening := not exists (
    select 1
    from public.discussion_messages m
    where m.discussion_id = p_discussion_id
      and m.id is distinct from p_message_id
  );

  notify_everyone :=
    is_opening
    and disc.notify_all
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = disc.organization_id
        and m.user_id = disc.created_by
        and m.status = 'active'
        and m.role in ('owner', 'admin', 'instructor')
    );

  perform set_config('coursewright.notification_write', '1', true);

  insert into public.notifications (
    organization_id,
    user_id,
    kind,
    discussion_id,
    discussion_message_id,
    actor_id,
    title,
    preview,
    audience_label
  )
  select
    disc.organization_id,
    recipient.user_id,
    'discussion_message',
    disc.id,
    p_message_id,
    p_author_id,
    disc.title,
    preview,
    audience_label
  from (
    select ci.user_id
    from public.course_instructors ci
    join public.memberships m
      on m.user_id = ci.user_id
     and m.organization_id = disc.organization_id
     and m.status = 'active'
     and m.role in ('owner', 'admin', 'instructor')
    where disc.audience = 'course'
      and ci.course_id = disc.course_id
      and ci.user_id is distinct from p_author_id

    union

    select cl.user_id
    from public.class_leaders cl
    join public.memberships m
      on m.user_id = cl.user_id
     and m.organization_id = disc.organization_id
     and m.status = 'active'
     and m.role in ('owner', 'admin', 'instructor')
    where disc.audience = 'class'
      and cl.class_id = disc.class_id
      and cl.user_id is distinct from p_author_id

    union

    select m.user_id
    from public.memberships m
    where disc.audience = 'organization'
      and m.organization_id = disc.organization_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'instructor')
      and m.user_id is distinct from p_author_id

    union

    select disc.created_by
    where disc.created_by is distinct from p_author_id

    union

    select m.author_id
    from public.discussion_messages m
    where m.discussion_id = p_discussion_id
      and m.deleted_at is null
      and m.author_id is distinct from p_author_id

    union

    select people.user_id
    from private.discussion_audience_people(
      disc.organization_id,
      disc.audience,
      disc.course_id,
      disc.class_id,
      disc.family_audience
    ) as people
    where notify_everyone
      and people.user_id is distinct from p_author_id
  ) as recipient
  where not exists (
    select 1
    from public.discussion_message_mentions ment
    where ment.message_id = p_message_id
      and ment.user_id = recipient.user_id
  )
  on conflict (user_id, discussion_id)
    where (
      kind in ('discussion_message', 'discussion_mention')
      and discussion_id is not null
    )
  do update
  set
    kind = case
      when public.notifications.kind = 'discussion_mention'
        and public.notifications.read_at is null
      then 'discussion_mention'
      else 'discussion_message'
    end,
    discussion_message_id = excluded.discussion_message_id,
    actor_id = excluded.actor_id,
    title = excluded.title,
    preview = excluded.preview,
    audience_label = excluded.audience_label,
    created_at = now(),
    read_at = null;
end;
$$;

-- Organization rows have no course_id / class_id (see 20261010100000 if applied earlier).
create or replace function private.discussion_target_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.audience = 'organization' then
    return new;
  end if;

  if new.audience = 'course' then
    select c.organization_id into target_org
    from public.courses c
    where c.id = new.course_id;
  elsif new.audience = 'class' then
    select c.organization_id into target_org
    from public.classes c
    where c.id = new.class_id
      and c.deleted_at is null;
  else
    return new;
  end if;

  if target_org is null or target_org is distinct from new.organization_id then
    raise exception 'That course or class needs to be in this organization.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;
