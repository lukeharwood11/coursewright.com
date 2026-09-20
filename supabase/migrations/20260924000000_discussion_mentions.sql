-- @mentions in discussion posts. People on the thread can be picked from an
-- @ popup; mentioned members get an Activity row (kind discussion_mention).

-- ---------------------------------------------------------------------------
-- Shared member list (staff + qualifying parents for a course or class)
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
  )
  select s.user_id, s.display_name, s.role
  from (
    select * from staff
    union
    select * from parents
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
      d.class_id
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
    d.class_id
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
    disc.class_id
  ) as people;
end;
$$;

create or replace function public.list_discussion_audience_members(
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
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.can_start_discussion(
    p_organization_id,
    p_audience,
    p_course_id,
    p_class_id
  ) then
    raise exception 'You can’t start a discussion for that course or class.';
  end if;

  return query
  select people.user_id, people.name, people.role
  from private.discussion_audience_people(
    p_organization_id,
    p_audience,
    p_course_id,
    p_class_id
  ) as people;
end;
$$;

revoke all on function public.list_discussion_audience_members(bigint, text, bigint, bigint)
  from public;
grant execute on function public.list_discussion_audience_members(bigint, text, bigint, bigint)
  to authenticated, service_role;

comment on function public.list_discussion_audience_members(bigint, text, bigint, bigint) is
  'People who would be on a discussion for this course or class; caller must be allowed to start that thread.';

-- ---------------------------------------------------------------------------
-- Mentions on a message
-- ---------------------------------------------------------------------------

create table public.discussion_message_mentions (
  id bigserial primary key,
  message_id bigint not null references public.discussion_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint discussion_message_mentions_message_user_key unique (message_id, user_id)
);

create index discussion_message_mentions_message_id_idx
  on public.discussion_message_mentions (message_id);
create index discussion_message_mentions_user_id_idx
  on public.discussion_message_mentions (user_id);

comment on table public.discussion_message_mentions is
  'SCHEMA.md DiscussionMessageMention — a person @mentioned in a discussion post';

create or replace function private.discussion_mention_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg record;
begin
  select m.id, m.discussion_id, m.author_id, m.deleted_at
  into msg
  from public.discussion_messages m
  where m.id = new.message_id;

  if msg.id is null or msg.deleted_at is not null then
    raise exception 'That message isn’t available.'
      using errcode = '23514';
  end if;

  if new.user_id is not distinct from msg.author_id then
    raise exception 'You can’t mention yourself.'
      using errcode = '23514';
  end if;

  if not private.is_discussion_member(msg.discussion_id, new.user_id) then
    raise exception 'That person isn’t on this discussion.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger discussion_message_mentions_guard
before insert on public.discussion_message_mentions
for each row execute function private.discussion_mention_guard();

alter table public.notifications
  drop constraint notifications_kind_chk;

alter table public.notifications
  add constraint notifications_kind_chk
  check (kind in ('discussion_message', 'discussion_mention'));

-- Allow SECURITY DEFINER mention notify to upgrade a post row to a mention.
create or replace function private.notification_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id
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

  if new.kind is distinct from old.kind
     and not (
       old.kind = 'discussion_message'
       and new.kind = 'discussion_mention'
     ) then
    raise exception 'That notification can’t be changed.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

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

create trigger discussion_message_mentions_notify
after insert on public.discussion_message_mentions
for each row execute function private.notify_discussion_mention();

alter table public.discussion_message_mentions enable row level security;

revoke all on table public.discussion_message_mentions from anon, authenticated;
grant select, insert on table public.discussion_message_mentions to authenticated;
grant select, insert, update, delete on table public.discussion_message_mentions
  to service_role;
grant usage, select on sequence public.discussion_message_mentions_id_seq
  to authenticated, service_role;

create policy discussion_message_mentions_select
on public.discussion_message_mentions
for select to authenticated
using ((select private.can_see_discussion((
  select m.discussion_id
  from public.discussion_messages m
  where m.id = message_id
))));

create policy discussion_message_mentions_insert
on public.discussion_message_mentions
for insert to authenticated
with check (
  exists (
    select 1
    from public.discussion_messages m
    where m.id = message_id
      and m.author_id = (select auth.uid())
      and m.deleted_at is null
  )
);
