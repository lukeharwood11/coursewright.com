-- Shared calendar events: one course, several classes, or the whole organization.
-- Write-up lives in event_blocks (not materials). Location is required.

create table public.events (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  audience text not null,
  course_ids bigint[] not null default '{}',
  class_ids bigint[] not null default '{}',
  title text not null,
  location text not null,
  starts_on date not null,
  ends_on date,
  start_time time,
  end_time time,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  constraint events_audience_chk check (audience in ('course', 'class', 'organization')),
  constraint events_targets_chk check (
    (
      audience = 'course'
      and cardinality(course_ids) = 1
      and cardinality(class_ids) = 0
    )
    or (
      audience = 'class'
      and cardinality(class_ids) >= 1
      and cardinality(course_ids) = 0
    )
    or (
      audience = 'organization'
      and cardinality(course_ids) = 0
      and cardinality(class_ids) = 0
    )
  ),
  constraint events_title_chk check (char_length(btrim(title)) > 0),
  constraint events_location_chk check (
    char_length(btrim(location)) > 0
    and char_length(location) <= 200
  ),
  constraint events_dates_chk check (ends_on is null or ends_on >= starts_on),
  constraint events_times_chk check (
    (end_time is null or start_time is not null)
    and (
      coalesce(ends_on, starts_on) > starts_on
      or end_time is null
      or start_time is null
      or end_time >= start_time
    )
  )
);

create index events_organization_id_idx on public.events (organization_id);
create index events_starts_on_idx on public.events (organization_id, starts_on)
  where deleted_at is null;
create index events_course_ids_idx on public.events using gin (course_ids);
create index events_class_ids_idx on public.events using gin (class_ids);
create index events_created_by_idx on public.events (created_by);

create trigger events_set_updated_at
before update on public.events
for each row execute function private.set_updated_at();

comment on table public.events is
  'SCHEMA.md Event — one course, several classes, or the whole organization; location required';

create or replace function private.event_targets_in_org()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_id bigint;
  target_org bigint;
begin
  if new.audience = 'organization' then
    return new;
  end if;
  if new.audience = 'course' then
    foreach target_id in array new.course_ids loop
      select c.organization_id into target_org
      from public.courses c
      where c.id = target_id;
      if target_org is null or target_org is distinct from new.organization_id then
        raise exception 'That audience needs to be in this organization.'
          using errcode = '23514';
      end if;
    end loop;
  else
    foreach target_id in array new.class_ids loop
      select c.organization_id into target_org
      from public.classes c
      where c.id = target_id
        and c.deleted_at is null;
      if target_org is null or target_org is distinct from new.organization_id then
        raise exception 'That audience needs to be in this organization.'
          using errcode = '23514';
      end if;
    end loop;
  end if;
  return new;
end;
$$;

create trigger events_targets_in_org
before insert or update on public.events
for each row execute function private.event_targets_in_org();

create table public.event_blocks (
  id bigserial primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  position int not null default 0,
  kind text not null,
  body jsonb not null default '{}'::jsonb,
  file_id bigint references public.files (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_blocks_kind_chk check (kind in ('rich_text', 'video'))
);

create index event_blocks_event_id_idx on public.event_blocks (event_id);
create index event_blocks_file_id_idx on public.event_blocks (file_id);
create index event_blocks_position_idx
  on public.event_blocks (event_id, position)
  where deleted_at is null;

create trigger event_blocks_set_updated_at
before update on public.event_blocks
for each row execute function private.set_updated_at();

comment on table public.event_blocks is
  'SCHEMA.md EventBlock — Lexical write-up on an event, not a course material';

create table public.event_materials (
  id bigserial primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  material_id bigint not null references public.materials (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint event_materials_event_material_key unique (event_id, material_id)
);

create index event_materials_material_id_idx on public.event_materials (material_id);

comment on table public.event_materials is
  'SCHEMA.md EventMaterial — existing course materials linked from an event';

create or replace function private.event_material_in_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  event_org bigint;
  event_audience text;
  event_courses bigint[];
  material_org bigint;
  material_course bigint;
  material_deleted timestamptz;
begin
  select e.organization_id, e.audience, e.course_ids
    into event_org, event_audience, event_courses
  from public.events e
  where e.id = new.event_id;

  if event_org is null then
    raise exception 'event not found';
  end if;

  select m.organization_id, m.course_id, m.deleted_at
    into material_org, material_course, material_deleted
  from public.materials m
  where m.id = new.material_id;

  if material_org is null or material_deleted is not null then
    raise exception 'That material is not available.';
  end if;
  if material_org is distinct from event_org then
    raise exception 'That material needs to be in this organization.';
  end if;
  if event_audience = 'course' and (
    material_course is null or not (material_course = any(event_courses))
  ) then
    raise exception 'Link a material from this event’s course.';
  end if;
  return new;
end;
$$;

create trigger event_materials_in_scope
before insert or update on public.event_materials
for each row execute function private.event_material_in_scope();

create or replace function private.can_manage_event(
  p_org_id bigint,
  p_audience text,
  p_course_ids bigint[],
  p_class_ids bigint[]
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
        cardinality(p_course_ids) = 1
        and (
          select bool_and(private.can_manage_course(cid))
          from unnest(p_course_ids) as cid
        )
      when 'organization' then
        private.is_org_staff(p_org_id)
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
      else false
    end;
$$;

create or replace function private.can_manage_event_row(p_event_id bigint)
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
      and private.can_manage_event(
        e.organization_id,
        e.audience,
        e.course_ids,
        e.class_ids
      )
  );
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
          )
        )
        or (
          e.audience = 'class'
          and exists (
            select 1
            from unnest(e.class_ids) as cid
            where private.parent_linked_to_class(cid)
          )
        )
        or (
          e.audience = 'organization'
          and private.is_org_member(e.organization_id)
        )
      )
  );
$$;

create or replace function private.can_view_event(p_event_id bigint)
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
        private.is_org_admin(e.organization_id)
        or (
          e.audience = 'course'
          and exists (
            select 1
            from unnest(e.course_ids) as cid
            where private.can_manage_course(cid)
          )
        )
        or (
          e.audience = 'class'
          and private.is_org_staff(e.organization_id)
        )
        or (
          e.audience = 'organization'
          and private.is_org_staff(e.organization_id)
        )
        or private.parent_can_view_event(e.id)
      )
  );
$$;

-- Parents may read a file attached to an event they can already see.
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
      and private.parent_can_view_course(m.course_id)
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
      and private.parent_can_view_course(m.course_id)
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

grant select, insert, update on table public.events to authenticated;
grant select, insert, update on table public.event_blocks to authenticated;
grant select, insert, delete on table public.event_materials to authenticated;
grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.event_blocks to service_role;
grant select, insert, update, delete on table public.event_materials to service_role;
grant usage, select on sequence public.events_id_seq to authenticated, service_role;
grant usage, select on sequence public.event_blocks_id_seq to authenticated, service_role;
grant usage, select on sequence public.event_materials_id_seq to authenticated, service_role;

grant execute on function private.can_manage_event(bigint, text, bigint[], bigint[]) to authenticated, service_role;
grant execute on function private.can_manage_event_row(bigint) to authenticated, service_role;
grant execute on function private.parent_can_view_event(bigint) to authenticated, service_role;
grant execute on function private.can_view_event(bigint) to authenticated, service_role;

alter table public.events enable row level security;
alter table public.event_blocks enable row level security;
alter table public.event_materials enable row level security;

create policy events_select on public.events
for select to authenticated
using ((select private.can_view_event(id)));

create policy events_insert on public.events
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_event(
    organization_id,
    audience,
    course_ids,
    class_ids
  ))
);

create policy events_update on public.events
for update to authenticated
using ((select private.can_manage_event_row(id)))
with check (
  (select private.can_manage_event(
    organization_id,
    audience,
    course_ids,
    class_ids
  ))
);

create policy event_blocks_select on public.event_blocks
for select to authenticated
using (
  deleted_at is null
  and (select private.can_view_event(event_id))
);

create policy event_blocks_insert on public.event_blocks
for insert to authenticated
with check ((select private.can_manage_event_row(event_id)));

create policy event_blocks_update on public.event_blocks
for update to authenticated
using ((select private.can_manage_event_row(event_id)))
with check ((select private.can_manage_event_row(event_id)));

create policy event_materials_select on public.event_materials
for select to authenticated
using ((select private.can_view_event(event_id)));

create policy event_materials_insert on public.event_materials
for insert to authenticated
with check (
  (select private.can_manage_event_row(event_id))
  and exists (
    select 1
    from public.materials m
    where m.id = material_id
      and m.deleted_at is null
      and m.course_id is not null
      and (select private.can_manage_course(m.course_id))
  )
);

create policy event_materials_delete on public.event_materials
for delete to authenticated
using ((select private.can_manage_event_row(event_id)));
