-- Explicit material save: one version when placement and/or page blocks actually change.
-- Typing in the editor does not write rows; Save calls public.save_material_page.

create or replace function private.material_versions_on_update()
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
  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    new.id,
    new.current_version,
    jsonb_build_object(
      'material', to_jsonb(new),
      'blocks', coalesce(
        (
          select jsonb_agg(to_jsonb(b) order by b.position, b.id)
          from public.blocks b
          where b.material_id = new.id
            and b.deleted_at is null
        ),
        '[]'::jsonb
      )
    ),
    coalesce((select auth.uid()), new.deleted_by, new.deprecated_by),
    private.material_change_type(old, new)
  );
  return new;
end;
$$;

create or replace function private.blocks_version_parent_material()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mid bigint;
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

  mid := coalesce(new.material_id, old.material_id);

  update public.materials m
  set current_version = m.current_version + 1
  where m.id = mid
  returning m.current_version into new_version;

  if new_version is null then
    return coalesce(new, old);
  end if;

  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    mid,
    new_version,
    private.material_page_snapshot(mid),
    (select auth.uid()),
    'update'
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.save_material_page(
  p_material_id bigint,
  p_placement jsonb default null,
  p_blocks jsonb default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  material public.materials%rowtype;
  next_title text;
  next_description text;
  next_url text;
  next_scheduled date;
  placement_changed boolean := false;
  current_blocks jsonb;
  next_blocks jsonb;
  blocks_changed boolean := false;
  new_version int;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to save.' using errcode = '42501';
  end if;

  select * into material
  from public.materials
  where id = p_material_id;

  if not found then
    raise exception 'That material isn’t there.' using errcode = 'P0002';
  end if;

  if material.course_id is not null then
    if not private.can_manage_course(material.course_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  elsif material.template_id is not null then
    if not private.can_edit_template(material.template_id) then
      raise exception 'You can’t edit this material.' using errcode = '42501';
    end if;
  else
    raise exception 'You can’t edit this material.' using errcode = '42501';
  end if;

  if p_placement is not null then
    next_title := coalesce(p_placement->>'title', material.title);
    next_description := coalesce(p_placement->>'description', material.description);
    if material.kind = 'link' then
      next_url := p_placement->>'url';
    else
      next_url := material.url;
    end if;
    if jsonb_exists(p_placement, 'scheduled_date') then
      next_scheduled := nullif(p_placement->>'scheduled_date', '')::date;
    else
      next_scheduled := material.scheduled_date;
    end if;
    placement_changed :=
      next_title is distinct from material.title
      or next_description is distinct from material.description
      or next_url is distinct from material.url
      or next_scheduled is distinct from material.scheduled_date;
  end if;

  if p_blocks is not null then
    if material.kind <> 'page' then
      raise exception 'Only page materials have lesson content.' using errcode = 'P0001';
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
        from public.blocks b
        where b.material_id = p_material_id
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
    return material.current_version;
  end if;

  perform set_config('coursewright.skip_version', 'on', true);

  if placement_changed then
    update public.materials
    set
      title = next_title,
      description = next_description,
      url = next_url,
      scheduled_date = next_scheduled
    where id = p_material_id;
  end if;

  if blocks_changed then
    update public.blocks
    set deleted_at = now()
    where material_id = p_material_id
      and deleted_at is null;

    insert into public.blocks (material_id, kind, body, position, file_id)
    select
      p_material_id,
      elem->>'kind',
      coalesce(elem->'body', '{}'::jsonb),
      coalesce((elem->>'position')::int, (ord - 1)::int),
      case
        when elem->>'file_id' ~ '^[0-9]+$' then (elem->>'file_id')::bigint
        else null
      end
    from jsonb_array_elements(p_blocks) with ordinality as t(elem, ord);
  end if;

  update public.materials m
  set current_version = m.current_version + 1
  where m.id = p_material_id
  returning m.current_version into new_version;

  insert into public.material_versions (material_id, version, snapshot, changed_by, change_type)
  values (
    p_material_id,
    new_version,
    private.material_page_snapshot(p_material_id),
    (select auth.uid()),
    'update'
  );

  return new_version;
end;
$$;

revoke all on function public.save_material_page(bigint, jsonb, jsonb) from public, anon;
grant execute on function public.save_material_page(bigint, jsonb, jsonb) to authenticated;

comment on function public.save_material_page(bigint, jsonb, jsonb) is
  'Save material placement and/or page blocks; insert one material_versions row only when something changed.';
