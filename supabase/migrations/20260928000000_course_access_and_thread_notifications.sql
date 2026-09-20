-- Instructors see courses they teach (or parent in); one Activity ping per
-- discussion for people on the thread.

-- ---------------------------------------------------------------------------
-- Course visibility
-- ---------------------------------------------------------------------------

create or replace function private.parent_can_view_course(p_course_id bigint)
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
    join public.parent_student_links psl
      on psl.student_profile_id = e.student_profile_id
     and psl.parent_user_id = (select auth.uid())
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
      or private.parent_can_view_course(p_course_id);
$$;

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
for select to authenticated
using ((select private.can_view_course(id)));

drop policy if exists course_instructors_select on public.course_instructors;
create policy course_instructors_select on public.course_instructors
for select to authenticated
using ((select private.can_view_course(course_id)));

drop policy if exists units_select on public.units;
create policy units_select on public.units
for select to authenticated
using (
  (course_id is not null and (
    (select private.can_manage_course(course_id))
    or (
      deleted_at is null
      and (select private.parent_can_view_course(course_id))
    )
  ))
  or (template_id is not null and (select private.can_view_template(template_id)))
);

drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials
for select to authenticated
using (
  (course_id is not null and (
    (select private.can_manage_course(course_id))
    or (select private.parent_can_view_material(id))
  ))
  or (template_id is not null and (select private.can_view_template(template_id)))
);

drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks
for select to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (
          (select private.can_manage_course(m.course_id))
          or (select private.parent_can_view_material(m.id))
        ))
        or (m.template_id is not null and (select private.can_view_template(m.template_id)))
      )
  )
);

drop policy if exists material_versions_select on public.material_versions;
create policy material_versions_select on public.material_versions
for select to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (
          (select private.can_manage_course(m.course_id))
          or (select private.parent_can_view_material(m.id))
        ))
        or (m.template_id is not null and (select private.can_view_template(m.template_id)))
      )
  )
);

drop policy if exists lesson_plans_select on public.lesson_plans;
create policy lesson_plans_select on public.lesson_plans
for select to authenticated
using (
  (select private.can_manage_course(course_id))
  or (
    deleted_at is null
    and visibility = 'published'
    and (select private.parent_can_view_course(course_id))
  )
);

drop policy if exists important_now_select on public.important_now;
create policy important_now_select on public.important_now
for select to authenticated
using (
  (select private.can_manage_course(course_id))
  or (select private.parent_can_view_material(material_id))
);

drop policy if exists share_links_select on public.share_links;
create policy share_links_select on public.share_links
for select to authenticated
using (
  (course_id is not null and (select private.can_view_course(course_id)))
);

drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments
for select to authenticated
using (
  (select private.can_view_course(course_id))
  or (select private.parent_linked_to_student(student_profile_id))
);

drop policy if exists enrollments_insert on public.enrollments;
create policy enrollments_insert on public.enrollments
for insert to authenticated
with check ((select private.can_manage_course(course_id)));

drop policy if exists enrollments_update on public.enrollments;
create policy enrollments_update on public.enrollments
for update to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

-- ---------------------------------------------------------------------------
-- Activity: one discussion_message row per person per thread; notify
-- people who started or posted, plus instructors / class leads.
-- ---------------------------------------------------------------------------

create or replace function private.notification_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Trigger-written coalescing / mention upgrades (nested from another trigger).
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id
     or new.kind is distinct from old.kind
     or new.discussion_id is distinct from old.discussion_id
     or new.discussion_message_id is distinct from old.discussion_message_id
     or new.actor_id is distinct from old.actor_id
     or new.title is distinct from old.title
     or new.preview is distinct from old.preview
     or new.audience_label is distinct from old.audience_label
     or new.created_at is distinct from old.created_at then
    raise exception 'That notification can’t be changed.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

alter table public.notifications disable trigger notifications_guard_update;

delete from public.notifications n
using public.notifications newer
where n.kind = 'discussion_message'
  and newer.kind = 'discussion_message'
  and n.user_id = newer.user_id
  and n.discussion_id is not distinct from newer.discussion_id
  and n.id < newer.id;

alter table public.notifications enable trigger notifications_guard_update;

drop index if exists public.notifications_user_discussion_message_kind_key;
create unique index notifications_user_discussion_message_kind_key
  on public.notifications (user_id, discussion_id)
  where kind = 'discussion_message' and discussion_id is not null;

create or replace function private.notify_discussion_message()
returns trigger
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
  if new.deleted_at is not null then
    return new;
  end if;

  select
    d.id,
    d.organization_id,
    d.audience,
    d.course_id,
    d.class_id,
    d.title,
    d.created_by,
    d.notify_all,
    d.deleted_at
  into disc
  from public.discussions d
  where d.id = new.discussion_id;

  if disc.id is null or disc.deleted_at is not null then
    return new;
  end if;

  preview := private.discussion_message_preview(new.body);
  if preview = '' then
    preview := 'Posted in this discussion.';
  end if;

  if disc.audience = 'course' then
    select c.title into audience_label
    from public.courses c
    where c.id = disc.course_id;
  else
    select c.title into audience_label
    from public.classes c
    where c.id = disc.class_id;
  end if;
  audience_label := coalesce(nullif(btrim(audience_label), ''), '');

  is_opening := not exists (
    select 1
    from public.discussion_messages m
    where m.discussion_id = new.discussion_id
      and m.id is distinct from new.id
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
    new.id,
    new.author_id,
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
      and ci.user_id is distinct from new.author_id

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
      and cl.user_id is distinct from new.author_id

    union

    select disc.created_by
    where disc.created_by is distinct from new.author_id

    union

    select m.author_id
    from public.discussion_messages m
    where m.discussion_id = new.discussion_id
      and m.deleted_at is null
      and m.author_id is distinct from new.author_id

    union

    select members.user_id
    from public.list_discussion_members(disc.id) as members
    where notify_everyone
      and members.user_id is distinct from new.author_id
  ) as recipient
  on conflict (user_id, discussion_id) where (kind = 'discussion_message')
  do update
  set
    actor_id = excluded.actor_id,
    title = excluded.title,
    preview = excluded.preview,
    audience_label = excluded.audience_label,
    created_at = now(),
    read_at = null;

  return new;
exception
  when others then
    raise warning 'Could not create discussion notifications: %', sqlerrm;
    return new;
end;
$$;
