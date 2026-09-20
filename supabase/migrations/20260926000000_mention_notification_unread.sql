-- An @mention is its own Activity ping. Upgrading a post notification to a
-- mention must reopen it (read_at = null). Opening the thread acks post
-- notifications only; mentions stay unread until the person clicks Activity.

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
  on conflict (user_id, discussion_message_id) do update
  set
    kind = 'discussion_mention',
    read_at = null;

  return new;
exception
  when others then
    raise warning 'Could not create mention notifications: %', sqlerrm;
    return new;
end;
$$;
