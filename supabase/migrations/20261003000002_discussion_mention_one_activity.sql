-- Class leads (and other post recipients) who are also @mentioned were getting
-- two Activity rows / device pings: a discussion_message fan-out, then a
-- separate discussion_mention. Mentions must upgrade the thread’s Activity row,
-- and posting with @mentions must fan out posts only after mentions exist so
-- mentioned people are skipped (one ping).

-- ---------------------------------------------------------------------------
-- One discussion Activity row per person per thread (post or mention)
-- ---------------------------------------------------------------------------

alter table public.notifications disable trigger notifications_guard_update;

-- Prefer a mention when both kinds exist for the same thread.
delete from public.notifications older
using public.notifications newer
where older.user_id = newer.user_id
  and older.discussion_id is not null
  and older.discussion_id is not distinct from newer.discussion_id
  and older.kind = 'discussion_message'
  and newer.kind = 'discussion_mention';

-- Any remaining same-thread pairs: keep the newest.
delete from public.notifications older
using public.notifications newer
where older.user_id = newer.user_id
  and older.discussion_id is not null
  and older.discussion_id is not distinct from newer.discussion_id
  and older.kind in ('discussion_message', 'discussion_mention')
  and newer.kind in ('discussion_message', 'discussion_mention')
  and older.id < newer.id;

alter table public.notifications enable trigger notifications_guard_update;

drop index if exists public.notifications_user_discussion_message_kind_key;

create unique index if not exists notifications_user_discussion_activity_key
  on public.notifications (user_id, discussion_id)
  where (
    kind in ('discussion_message', 'discussion_mention')
    and discussion_id is not null
  );

comment on index public.notifications_user_discussion_activity_key is
  'One discussion Activity row per person per thread (post or @mention).';

-- ---------------------------------------------------------------------------
-- Shared post fan-out (trigger + RPC). Skips people mentioned on this message.
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
  else
    select c.title into audience_label
    from public.classes c
    where c.id = disc.class_id;
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
      disc.class_id
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
    -- Keep an unread @mention as the Activity kind; refresh the rest.
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

create or replace function private.notify_discussion_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('coursewright.skip_discussion_message_notify', true) = '1' then
    return new;
  end if;

  begin
    perform private.notify_discussion_message_row(
      new.id,
      new.discussion_id,
      new.author_id,
      new.body,
      new.deleted_at
    );
  exception
    when others then
      raise warning 'Could not create discussion notifications: %', sqlerrm;
  end;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- @mention: upgrade the thread Activity row (not a second row per message)
-- ---------------------------------------------------------------------------

create or replace function private.notify_discussion_mention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg record;
  disc record;
  preview text;
  audience_label text;
  updated int;
begin
  select m.id, m.discussion_id, m.author_id, m.body, m.deleted_at
  into msg
  from public.discussion_messages m
  where m.id = new.message_id;

  if msg.id is null or msg.deleted_at is not null then
    return new;
  end if;

  if new.user_id is not distinct from msg.author_id then
    return new;
  end if;

  select
    d.id,
    d.organization_id,
    d.audience,
    d.course_id,
    d.class_id,
    d.title,
    d.deleted_at
  into disc
  from public.discussions d
  where d.id = msg.discussion_id;

  if disc.id is null or disc.deleted_at is not null then
    return new;
  end if;

  if not private.is_discussion_member(disc.id, new.user_id) then
    return new;
  end if;

  preview := private.discussion_message_preview(msg.body);
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

  perform set_config('coursewright.notification_write', '1', true);

  update public.notifications n
  set
    kind = 'discussion_mention',
    discussion_message_id = msg.id,
    actor_id = msg.author_id,
    title = disc.title,
    preview = preview,
    audience_label = audience_label,
    created_at = now(),
    read_at = null
  where n.user_id = new.user_id
    and n.discussion_id = disc.id
    and n.kind in ('discussion_message', 'discussion_mention');

  get diagnostics updated = row_count;
  if updated > 0 then
    return new;
  end if;

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
  values (
    disc.organization_id,
    new.user_id,
    'discussion_mention',
    disc.id,
    msg.id,
    msg.author_id,
    disc.title,
    preview,
    audience_label
  )
  on conflict (user_id, discussion_id)
    where (
      kind in ('discussion_message', 'discussion_mention')
      and discussion_id is not null
    )
  do update
  set
    kind = 'discussion_mention',
    discussion_message_id = excluded.discussion_message_id,
    actor_id = excluded.actor_id,
    title = excluded.title,
    preview = excluded.preview,
    audience_label = excluded.audience_label,
    created_at = now(),
    read_at = null;

  return new;
exception
  when others then
    raise warning 'Could not create mention notifications: %', sqlerrm;
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- One RPC: message + mentions in one transaction, then post fan-out for the
-- remaining recipients (mentioned people already have a mention Activity row).
-- ---------------------------------------------------------------------------

create or replace function public.post_discussion_message(
  p_discussion_id bigint,
  p_body text,
  p_mentioned_user_ids uuid[] default '{}'
)
returns bigint
language plpgsql
-- Definer so we can call private.notify_discussion_message_row (EXECUTE
-- revoked from authenticated). Authz is auth.uid() + can_see_discussion;
-- author_id is always the caller.
security definer
set search_path = ''
as $$
declare
  uid uuid;
  msg_id bigint;
  mention_id uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Sign in to post.'
      using errcode = '42501';
  end if;

  if p_discussion_id is null then
    raise exception 'That discussion couldn’t be found.'
      using errcode = '22023';
  end if;

  if not private.can_see_discussion(p_discussion_id) then
    raise exception 'You can’t post in this discussion.'
      using errcode = '42501';
  end if;

  perform set_config('coursewright.skip_discussion_message_notify', '1', true);

  insert into public.discussion_messages (
    discussion_id,
    author_id,
    body
  )
  values (
    p_discussion_id,
    uid,
    coalesce(p_body, '')
  )
  returning id into msg_id;

  if p_mentioned_user_ids is not null then
    foreach mention_id in array p_mentioned_user_ids
    loop
      if mention_id is null or mention_id is not distinct from uid then
        continue;
      end if;
      insert into public.discussion_message_mentions (message_id, user_id)
      values (msg_id, mention_id)
      on conflict (message_id, user_id) do nothing;
    end loop;
  end if;

  perform set_config('coursewright.skip_discussion_message_notify', '0', true);

  perform private.notify_discussion_message_row(
    msg_id,
    p_discussion_id,
    uid,
    coalesce(p_body, ''),
    null
  );

  return msg_id;
exception
  when others then
    -- Never leave the skip flag set for the rest of the session.
    perform set_config('coursewright.skip_discussion_message_notify', '0', true);
    raise;
end;
$$;

revoke all on function public.post_discussion_message(bigint, text, uuid[])
  from public, anon;
grant execute on function public.post_discussion_message(bigint, text, uuid[])
  to authenticated;

revoke all on function private.notify_discussion_message_row(
  bigint, bigint, uuid, text, timestamptz
) from public, anon, authenticated;

comment on function public.post_discussion_message(bigint, text, uuid[]) is
  'Insert a discussion post and optional @mentions in one transaction so Activity is one row per person.';
