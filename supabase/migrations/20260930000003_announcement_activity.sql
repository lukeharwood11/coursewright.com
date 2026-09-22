-- Opt-in announcement Activity. Staff "Send notification" writes one
-- announcement row per claimed family account (same people as the email),
-- and a later send updates that row instead of stacking.

alter table public.notifications
  add column if not exists announcement_id bigint
    references public.announcements (id) on delete cascade;

create index if not exists notifications_announcement_id_idx
  on public.notifications (announcement_id)
  where announcement_id is not null;

alter table public.notifications
  drop constraint if exists notifications_kind_chk;

alter table public.notifications
  add constraint notifications_kind_chk
  check (kind in ('discussion_message', 'discussion_mention', 'announcement'));

create unique index if not exists notifications_user_announcement_kind_key
  on public.notifications (user_id, announcement_id)
  where kind = 'announcement' and announcement_id is not null;

-- Client updates may only change read_at. Trigger coalescing and this
-- function's upsert set a transaction-local flag so they can refresh a row.
create or replace function private.notification_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1
     or current_setting('coursewright.notification_write', true) = '1' then
    return new;
  end if;

  if new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id
     or new.kind is distinct from old.kind
     or new.discussion_id is distinct from old.discussion_id
     or new.discussion_message_id is distinct from old.discussion_message_id
     or new.announcement_id is distinct from old.announcement_id
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

comment on function public.notify_announcement(bigint, uuid) is
  'One Activity row per claimed family account for this announcement. Service role only; called when staff send a notification.';
