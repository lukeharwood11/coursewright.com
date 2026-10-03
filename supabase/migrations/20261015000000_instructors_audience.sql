-- Staff-only "instructors" audience for discussions and announcements
-- (owners, admins, instructors, observers — no families).

alter table public.discussions
  drop constraint if exists discussions_audience_chk;

alter table public.discussions
  add constraint discussions_audience_chk
  check (audience in ('course', 'class', 'organization', 'instructors'));

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
      audience in ('organization', 'instructors')
      and course_id is null
      and class_id is null
    )
  );

create index if not exists discussions_instructors_audience_idx
  on public.discussions (organization_id, last_message_at desc)
  where deleted_at is null and audience = 'instructors';

alter table public.announcements
  drop constraint if exists announcements_audience_chk;

alter table public.announcements
  add constraint announcements_audience_chk
  check (audience in ('course', 'class', 'student', 'instructors'));

alter table public.announcements
  drop constraint if exists announcements_audience_targets_chk;

alter table public.announcements
  add constraint announcements_audience_targets_chk
  check (
    (
      audience = 'course'
      and cardinality(course_ids) >= 1
      and class_ids = '{}'::bigint[]
      and student_profile_ids = '{}'::bigint[]
    )
    or (
      audience = 'class'
      and cardinality(class_ids) >= 1
      and course_ids = '{}'::bigint[]
      and student_profile_ids = '{}'::bigint[]
    )
    or (
      audience = 'student'
      and cardinality(student_profile_ids) >= 1
      and course_ids = '{}'::bigint[]
      and class_ids = '{}'::bigint[]
    )
    or (
      audience = 'instructors'
      and course_ids = '{}'::bigint[]
      and class_ids = '{}'::bigint[]
      and student_profile_ids = '{}'::bigint[]
    )
  );

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
        nullif(p_course_id, 0) is not null
        and exists (
          select 1
          from public.courses c
          where c.id = nullif(p_course_id, 0)
            and c.organization_id = p_org_id
        )
        and (
          private.can_manage_course(nullif(p_course_id, 0))
          or private.parent_can_view_course(nullif(p_course_id, 0))
          or private.student_can_view_course(nullif(p_course_id, 0))
        )
      when 'class' then
        nullif(p_class_id, 0) is not null
        and exists (
          select 1
          from public.classes c
          where c.id = nullif(p_class_id, 0)
            and c.organization_id = p_org_id
            and c.deleted_at is null
        )
        and (
          private.is_org_staff(p_org_id)
          or private.parent_linked_to_class(nullif(p_class_id, 0))
          or private.student_linked_to_class(nullif(p_class_id, 0))
        )
      when 'organization' then
        nullif(p_course_id, 0) is null
        and nullif(p_class_id, 0) is null
        and (select private.is_org_staff(p_org_id))
      when 'instructors' then
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
    where p_audience <> 'instructors'
      and m.organization_id = p_organization_id
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
    where p_audience <> 'instructors'
      and m.organization_id = p_organization_id
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
    where p_audience = 'instructors'
    union
    select * from staff
    where p_audience <> 'instructors'
    union
    select * from parents
    where p_audience <> 'instructors'
    union
    select * from students
    where p_audience <> 'instructors'
  ) s
  order by lower(s.display_name), s.role;
$$;

create or replace function private.discussion_target_in_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.audience in ('organization', 'instructors') then
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

create or replace function private.can_post_announcement(
  p_org_id bigint,
  p_audience text,
  p_course_ids bigint[],
  p_class_ids bigint[],
  p_student_ids bigint[]
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
        cardinality(p_course_ids) >= 1
        and (
          select bool_and(private.can_manage_course(cid))
          from unnest(p_course_ids) as cid
        )
      when 'class' then
        private.is_org_staff(p_org_id)
        and cardinality(p_class_ids) >= 1
        and (
          select bool_and(
            exists (
              select 1
              from public.classes c
              where c.id = cid
                and c.organization_id = p_org_id
                and c.deleted_at is null
            )
          )
          from unnest(p_class_ids) as cid
        )
      when 'student' then
        private.is_org_staff(p_org_id)
        and cardinality(p_student_ids) >= 1
        and (
          select bool_and(
            exists (
              select 1
              from public.student_profiles s
              where s.id = sid
                and s.organization_id = p_org_id
            )
          )
          from unnest(p_student_ids) as sid
        )
      when 'instructors' then
        private.is_org_staff(p_org_id)
        and cardinality(p_course_ids) = 0
        and cardinality(p_class_ids) = 0
        and cardinality(p_student_ids) = 0
      else false
    end;
$$;

drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements
for select to authenticated
using (
  (select private.can_browse_as_staff(organization_id))
  or (
    deleted_at is null
    and (select private.parent_can_view_announcement(id))
  )
);

-- Patch notify_discussion_message_row for instructors audience label + fan-out.
do $$
declare
  def text;
begin
  def := pg_get_functiondef(
    'private.notify_discussion_message_row(bigint,bigint,uuid,text,timestamptz)'::regprocedure
  );
  if def is null then
    raise exception 'notify_discussion_message_row missing';
  end if;

  if def not ilike '%disc.audience = ''instructors''%' then
    def := replace(
      def,
      E'  elsif disc.audience = ''class'' then\n    select c.title into audience_label\n    from public.classes c\n    where c.id = disc.class_id;\n  else',
      E'  elsif disc.audience = ''class'' then\n    select c.title into audience_label\n    from public.classes c\n    where c.id = disc.class_id;\n  elsif disc.audience = ''instructors'' then\n    audience_label := ''Instructors'';\n  else'
    );
    def := replace(
      def,
      E'    where disc.audience = ''organization''\n      and m.organization_id = disc.organization_id\n      and m.status = ''active''\n      and m.role in (''owner'', ''admin'', ''instructor'')\n      and m.user_id is distinct from p_author_id\n\n    union',
      E'    where disc.audience = ''organization''\n      and m.organization_id = disc.organization_id\n      and m.status = ''active''\n      and m.role in (''owner'', ''admin'', ''instructor'')\n      and m.user_id is distinct from p_author_id\n\n    union\n\n    select m.user_id\n    from public.memberships m\n    where disc.audience = ''instructors''\n      and m.organization_id = disc.organization_id\n      and m.status = ''active''\n      and m.role in (''owner'', ''admin'', ''instructor'', ''observer'')\n      and m.user_id is distinct from p_author_id\n\n    union'
    );
    execute def;
  end if;
end;
$$;

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

  if ann.audience = 'instructors' then
    audience_label := 'Instructors';
  else
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
  end if;

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
    where ann.audience <> 'instructors'
      and psl.parent_user_id is distinct from actor
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
    where ann.audience <> 'instructors'
      and sp.organization_id = ann.organization_id
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
    union
    select m.user_id
    from public.memberships m
    where ann.audience = 'instructors'
      and m.organization_id = ann.organization_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'instructor', 'observer')
      and m.user_id is distinct from actor
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

revoke all on function public.notify_announcement(bigint, uuid) from public;
revoke all on function public.notify_announcement(bigint, uuid) from anon, authenticated;
grant execute on function public.notify_announcement(bigint, uuid) to service_role;
