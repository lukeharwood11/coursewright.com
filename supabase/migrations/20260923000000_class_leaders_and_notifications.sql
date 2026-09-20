-- Class leads (owners/admins assign staff) + in-app Activity notifications.
-- Discussion posts notify course instructors or class leads. Staff may opt
-- in on create to notify everyone who can see the thread.

-- ---------------------------------------------------------------------------
-- ClassLeader
-- ---------------------------------------------------------------------------

create table public.class_leaders (
  id bigserial primary key,
  class_id bigint not null references public.classes (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint class_leaders_class_user_key unique (class_id, user_id)
);

create index class_leaders_class_id_idx on public.class_leaders (class_id);
create index class_leaders_user_id_idx on public.class_leaders (user_id);

comment on table public.class_leaders is
  'SCHEMA.md ClassLeader — owner/admin/instructor assigned as a lead for a class';

create or replace function private.class_leader_is_staff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_id bigint;
begin
  select c.organization_id into org_id
  from public.classes c
  where c.id = new.class_id
    and c.deleted_at is null;

  if org_id is null then
    raise exception 'That class isn’t available.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = new.user_id
      and m.status = 'active'
      and m.role in ('owner', 'admin', 'instructor')
  ) then
    raise exception 'A class lead needs to be an owner, admin, or instructor in this organization.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger class_leaders_staff_only
before insert or update on public.class_leaders
for each row execute function private.class_leader_is_staff();

create or replace function private.membership_cleanup_class_leaders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user uuid;
  target_org bigint;
begin
  if tg_op = 'DELETE' then
    target_user := old.user_id;
    target_org := old.organization_id;
  else
    if new.status = 'active'
       and new.role in ('owner', 'admin', 'instructor') then
      return new;
    end if;
    target_user := new.user_id;
    target_org := new.organization_id;
  end if;

  delete from public.class_leaders cl
  using public.classes c
  where cl.class_id = c.id
    and c.organization_id = target_org
    and cl.user_id = target_user;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger memberships_cleanup_class_leaders
after update or delete on public.memberships
for each row execute function private.membership_cleanup_class_leaders();

-- ---------------------------------------------------------------------------
-- discussions.notify_all (staff-only on create; opening post fans out)
-- ---------------------------------------------------------------------------

alter table public.discussions
  add column if not exists notify_all boolean not null default false;

comment on column public.discussions.notify_all is
  'When true, the opening post notifies everyone who can see the thread (staff create only).';

create or replace function private.discussion_notify_all_staff_only()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.notify_all and not private.is_org_staff(new.organization_id) then
    new.notify_all := false;
  end if;
  return new;
end;
$$;

drop trigger if exists discussions_notify_all_staff_only on public.discussions;
create trigger discussions_notify_all_staff_only
before insert on public.discussions
for each row execute function private.discussion_notify_all_staff_only();

create or replace function private.discussion_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.audience is distinct from old.audience
     or new.course_id is distinct from old.course_id
     or new.class_id is distinct from old.class_id
     or new.created_by is distinct from old.created_by
     or new.title is distinct from old.title
     or new.notify_all is distinct from old.notify_all then
    raise exception 'This discussion’s title and audience can’t be changed.'
      using errcode = '23514';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    if not private.is_org_staff(old.organization_id) then
      raise exception 'Only staff can remove a discussion.'
        using errcode = '42501';
    end if;
  end if;

  if new.answered_at is distinct from old.answered_at
     or new.answered_by is distinct from old.answered_by then
    if (select auth.uid()) is distinct from old.created_by
       and not private.is_org_staff(old.organization_id) then
      raise exception 'Only the person who started this discussion, or staff, can mark it answered.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notification
-- ---------------------------------------------------------------------------

create table public.notifications (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  kind text not null,
  discussion_id bigint references public.discussions (id) on delete cascade,
  discussion_message_id bigint references public.discussion_messages (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  title text not null,
  preview text not null default '',
  audience_label text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_kind_chk check (kind in ('discussion_message')),
  constraint notifications_title_chk check (char_length(btrim(title)) > 0),
  constraint notifications_discussion_message_user_key
    unique (user_id, discussion_message_id)
);

create index notifications_user_org_created_idx
  on public.notifications (user_id, organization_id, created_at desc);
create index notifications_user_org_unread_idx
  on public.notifications (user_id, organization_id)
  where read_at is null;
create index notifications_discussion_id_idx
  on public.notifications (discussion_id)
  where discussion_id is not null;

comment on table public.notifications is
  'SCHEMA.md Notification — per-user Activity item; clicking sets read_at';

create or replace function private.notification_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
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

create trigger notifications_guard_update
before update on public.notifications
for each row execute function private.notification_guard_update();

create or replace function private.jsonb_collect_text(p jsonb)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  piece text := '';
  child jsonb;
begin
  if p is null then
    return '';
  end if;
  if jsonb_typeof(p) = 'string' then
    return p #>> '{}';
  end if;
  if jsonb_typeof(p) = 'object' then
    if jsonb_typeof(p->'text') = 'string' then
      piece := p->>'text';
    end if;
    if p ? 'lexical' then
      piece := piece || private.jsonb_collect_text(p->'lexical');
    end if;
    if jsonb_typeof(p->'children') = 'array' then
      for child in select value from jsonb_array_elements(p->'children')
      loop
        piece := piece || private.jsonb_collect_text(child);
      end loop;
    end if;
    return piece;
  end if;
  if jsonb_typeof(p) = 'array' then
    for child in select value from jsonb_array_elements(p)
    loop
      piece := piece || private.jsonb_collect_text(child);
    end loop;
    return piece;
  end if;
  return '';
end;
$$;

create or replace function private.discussion_message_preview(p_body text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  trimmed text;
  payload jsonb;
  preview text;
begin
  trimmed := btrim(coalesce(p_body, ''));
  if trimmed = '' then
    return '';
  end if;
  if left(trimmed, 1) = '{' then
    begin
      payload := trimmed::jsonb;
      preview := btrim(private.jsonb_collect_text(payload));
      if preview <> '' then
        return left(preview, 160);
      end if;
    exception
      when others then
        null;
    end;
  end if;
  return left(trimmed, 160);
end;
$$;

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
  ) as recipient
  on conflict (user_id, discussion_message_id) do nothing;

  if notify_everyone then
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
      members.user_id,
      'discussion_message',
      disc.id,
      new.id,
      new.author_id,
      disc.title,
      preview,
      audience_label
    from public.list_discussion_members(disc.id) as members
    where members.user_id is distinct from new.author_id
    on conflict (user_id, discussion_message_id) do nothing;
  end if;

  return new;
exception
  when others then
    raise warning 'Could not create discussion notifications: %', sqlerrm;
    return new;
end;
$$;

create trigger discussion_messages_notify
after insert on public.discussion_messages
for each row execute function private.notify_discussion_message();

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------

alter table public.class_leaders enable row level security;
alter table public.notifications enable row level security;

revoke all on table public.class_leaders from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;

grant select, insert, delete on table public.class_leaders to authenticated;
grant select, update on table public.notifications to authenticated;
grant select, insert, update, delete on table public.class_leaders to service_role;
grant select, insert, update, delete on table public.notifications to service_role;
grant usage, select on sequence public.class_leaders_id_seq to authenticated, service_role;
grant usage, select on sequence public.notifications_id_seq to authenticated, service_role;

create policy class_leaders_select on public.class_leaders
for select to authenticated
using ((select private.is_org_staff((
  select c.organization_id from public.classes c where c.id = class_id
))));

create policy class_leaders_insert on public.class_leaders
for insert to authenticated
with check ((select private.is_org_admin((
  select c.organization_id from public.classes c where c.id = class_id
))));

create policy class_leaders_delete on public.class_leaders
for delete to authenticated
using ((select private.is_org_admin((
  select c.organization_id from public.classes c where c.id = class_id
))));

create policy notifications_select on public.notifications
for select to authenticated
using (user_id = (select auth.uid()));

create policy notifications_update on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
