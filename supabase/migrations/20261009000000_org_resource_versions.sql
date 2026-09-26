-- Org resource item version history (parity with material_versions).

alter table public.org_resource_items
  add column if not exists current_version int not null default 1;

create table public.org_resource_versions (
  id bigserial primary key,
  item_id bigint not null references public.org_resource_items (id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  change_type text not null,
  constraint org_resource_versions_change_type_chk check (
    change_type in ('create', 'update', 'delete', 'restore')
  ),
  constraint org_resource_versions_item_version_key unique (item_id, version)
);

create index org_resource_versions_item_id_idx on public.org_resource_versions (item_id);
create index org_resource_versions_changed_by_idx on public.org_resource_versions (changed_by);

comment on table public.org_resource_versions is
  'SCHEMA.md OrgResourceVersion — snapshot includes org_resource_items row + blocks array';

create or replace function private.resource_page_snapshot(p_item_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'item', to_jsonb(i),
    'blocks', coalesce(
      (
        select jsonb_agg(to_jsonb(b) order by b.position, b.id)
        from public.org_resource_blocks b
        where b.item_id = p_item_id
          and b.deleted_at is null
      ),
      '[]'::jsonb
    )
  )
  from public.org_resource_items i
  where i.id = p_item_id;
$$;

create or replace function private.resource_change_type(
  old_row public.org_resource_items,
  new_row public.org_resource_items
)
returns text
language sql
immutable
as $$
  select case
    when new_row.archived_at is not null and old_row.archived_at is null then 'delete'
    when old_row.archived_at is not null and new_row.archived_at is null then 'restore'
    else 'update'
  end;
$$;

create or replace function private.org_resource_items_versions_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.org_resource_versions (item_id, version, snapshot, changed_by, change_type)
  values (
    new.id,
    new.current_version,
    private.resource_page_snapshot(new.id),
    (select auth.uid()),
    'create'
  );
  return new;
end;
$$;

create trigger org_resource_items_after_insert_version
after insert on public.org_resource_items
for each row execute function private.org_resource_items_versions_on_insert();

create or replace function private.org_resource_items_versions_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('coursewright.skip_version', true) = 'on' then
    return new;
  end if;
  if to_jsonb(new) - 'updated_at' - 'current_version' - 'search_vector'
     is not distinct from to_jsonb(old) - 'updated_at' - 'current_version' - 'search_vector' then
    return new;
  end if;
  new.current_version := old.current_version + 1;
  insert into public.org_resource_versions (item_id, version, snapshot, changed_by, change_type)
  values (
    new.id,
    new.current_version,
    jsonb_build_object(
      'item', to_jsonb(new),
      'blocks', coalesce(
        (
          select jsonb_agg(to_jsonb(b) order by b.position, b.id)
          from public.org_resource_blocks b
          where b.item_id = new.id
            and b.deleted_at is null
        ),
        '[]'::jsonb
      )
    ),
    (select auth.uid()),
    private.resource_change_type(old, new)
  );
  return new;
end;
$$;

create trigger org_resource_items_before_update_version
before update on public.org_resource_items
for each row execute function private.org_resource_items_versions_on_update();

create or replace function private.org_resource_blocks_version_parent_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  iid bigint;
  new_version int;
begin
  if current_setting('coursewright.skip_version', true) = 'on' then
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE'
     and to_jsonb(new) - 'updated_at'
         is not distinct from to_jsonb(old) - 'updated_at' then
    return new;
  end if;

  iid := coalesce(new.item_id, old.item_id);

  update public.org_resource_items i
  set current_version = i.current_version + 1
  where i.id = iid
  returning i.current_version into new_version;

  if new_version is null then
    return coalesce(new, old);
  end if;

  insert into public.org_resource_versions (item_id, version, snapshot, changed_by, change_type)
  values (
    iid,
    new_version,
    private.resource_page_snapshot(iid),
    (select auth.uid()),
    'update'
  );

  return coalesce(new, old);
end;
$$;

create trigger org_resource_blocks_after_change_version
after insert or update or delete on public.org_resource_blocks
for each row execute function private.org_resource_blocks_version_parent_item();

-- Seed version 1 for rows created before this migration (no-op when empty).
insert into public.org_resource_versions (item_id, version, snapshot, changed_by, change_type)
select
  i.id,
  i.current_version,
  private.resource_page_snapshot(i.id),
  i.created_by,
  'create'
from public.org_resource_items i
where not exists (
  select 1
  from public.org_resource_versions v
  where v.item_id = i.id
);

alter table public.org_resource_versions enable row level security;

grant select on table public.org_resource_versions to authenticated;

create policy org_resource_versions_select on public.org_resource_versions
for select to authenticated
using ((select private.can_edit_org_resource_item(item_id)));

-- ---------------------------------------------------------------------------
-- save_resource_page
-- ---------------------------------------------------------------------------

create or replace function public.save_resource_page(
  p_item_id bigint,
  p_placement jsonb default null,
  p_blocks jsonb default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.org_resource_items%rowtype;
  next_title text;
  next_description text;
  next_url text;
  placement_changed boolean := false;
  current_blocks jsonb;
  next_blocks jsonb;
  blocks_changed boolean := false;
  new_version int;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to save.' using errcode = '42501';
  end if;

  select * into item
  from public.org_resource_items
  where id = p_item_id;

  if not found then
    raise exception 'That resource isn’t there.' using errcode = 'P0002';
  end if;

  if not private.can_edit_org_resource_item(p_item_id) then
    raise exception 'You can’t edit this resource.' using errcode = '42501';
  end if;

  if p_placement is not null then
    next_title := coalesce(p_placement->>'title', item.title);
    next_description := coalesce(p_placement->>'description', item.description);
    if item.type = 'link' then
      next_url := p_placement->>'url';
    else
      next_url := item.url;
    end if;
    placement_changed :=
      next_title is distinct from item.title
      or next_description is distinct from item.description
      or next_url is distinct from item.url;
  end if;

  if p_blocks is not null then
    if item.type <> 'document' then
      raise exception 'Only document resources have page content.' using errcode = 'P0001';
    end if;
    if jsonb_typeof(p_blocks) <> 'array' then
      raise exception 'Page content is not in a shape we can save.' using errcode = 'P0001';
    end if;

    select coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'kind', b.kind,
            'body', b.body,
            'position', b.position,
            'file_id', b.file_id
          )
          order by b.position, b.id
        )
        from public.org_resource_blocks b
        where b.item_id = p_item_id
          and b.deleted_at is null
      ),
      '[]'::jsonb
    )
    into current_blocks;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'kind', elem->>'kind',
          'body', coalesce(elem->'body', '{}'::jsonb),
          'position', coalesce((elem->>'position')::int, (ord - 1)::int),
          'file_id', case
            when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
            else null
          end
        )
        order by coalesce((elem->>'position')::int, (ord - 1)::int), ord
      ),
      '[]'::jsonb
    )
    into next_blocks
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);

    if exists (
      select 1
      from jsonb_array_elements(p_blocks) as elem
      where coalesce(elem->>'kind', '') not in ('rich_text', 'video')
    ) then
      raise exception 'That block type isn’t supported yet.' using errcode = 'P0001';
    end if;

    blocks_changed := current_blocks is distinct from next_blocks;
  end if;

  if not placement_changed and not blocks_changed then
    return item.current_version;
  end if;

  perform set_config('coursewright.skip_version', 'on', true);

  if placement_changed then
    update public.org_resource_items
    set
      title = next_title,
      description = next_description,
      url = next_url
    where id = p_item_id;
  end if;

  if blocks_changed then
    update public.org_resource_blocks
    set deleted_at = now()
    where item_id = p_item_id
      and deleted_at is null;

    insert into public.org_resource_blocks (item_id, kind, body, position, file_id)
    select
      p_item_id,
      elem->>'kind',
      coalesce(elem->'body', '{}'::jsonb),
      coalesce((elem->>'position')::int, (ord - 1)::int),
      case
        when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
        else null
      end
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);
  end if;

  update public.org_resource_items i
  set current_version = i.current_version + 1
  where i.id = p_item_id
  returning i.current_version into new_version;

  insert into public.org_resource_versions (item_id, version, snapshot, changed_by, change_type)
  values (
    p_item_id,
    new_version,
    private.resource_page_snapshot(p_item_id),
    (select auth.uid()),
    'update'
  );

  return new_version;
end;
$$;

revoke all on function public.save_resource_page(bigint, jsonb, jsonb) from public, anon;
grant execute on function public.save_resource_page(bigint, jsonb, jsonb) to authenticated;

comment on function public.save_resource_page(bigint, jsonb, jsonb) is
  'Save resource placement and/or document blocks; insert one org_resource_versions row only when something changed.';
