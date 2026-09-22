-- Activity inserts were silently failing: ON CONFLICT WHERE did not match the
-- partial unique index (kind + discussion_id is not null), so Postgres raised
-- "no unique or exclusion constraint matching the ON CONFLICT specification"
-- and the trigger's exception handler swallowed it. Also point coalesced rows
-- at the latest message, and fan out Notify everyone via discussion_audience_people
-- (no can_see_discussion check that can abort the batch).

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

    select people.user_id
    from private.discussion_audience_people(
      disc.organization_id,
      disc.audience,
      disc.course_id,
      disc.class_id
    ) as people
    where notify_everyone
      and people.user_id is distinct from new.author_id
  ) as recipient
  on conflict (user_id, discussion_id)
    where (kind = 'discussion_message' and discussion_id is not null)
  do update
  set
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
    raise warning 'Could not create discussion notifications: %', sqlerrm;
    return new;
end;
$$;
