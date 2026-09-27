-- Placement work type: material (date available, no due/submissions)
-- vs assignment (due date + optional submissions).

alter table public.materials
  add column work_type text not null default 'material';

update public.materials
set work_type = 'assignment'
where due_date is not null
   or accept_submissions
   or gradable;

update public.materials
set
  due_date = null,
  due_at = null,
  due_timezone = null,
  accept_submissions = false,
  gradable = false,
  points_possible = null
where work_type = 'material'
  and (
    due_date is not null
    or due_at is not null
    or due_timezone is not null
    or accept_submissions
    or gradable
    or points_possible is not null
  );

alter table public.materials
  add constraint materials_work_type_chk
    check (work_type in ('material', 'assignment')),
  add constraint materials_work_type_material_dates_chk
    check (
      work_type <> 'material'
      or (
        due_date is null
        and due_at is null
        and due_timezone is null
        and accept_submissions = false
        and gradable = false
        and points_possible is null
      )
    );

comment on column public.materials.work_type is
  'material = date available (scheduled_date) only; assignment = due date and optional submissions. Same materials row, not a separate table.';

-- ---------------------------------------------------------------------------
-- save_material_page stores work_type and clears due/submissions for materials
-- ---------------------------------------------------------------------------

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
  next_work_type text;
  next_scheduled date;
  next_due date;
  next_accept boolean;
  next_allow_past boolean;
  next_limit int;
  next_types text[];
  next_due_at timestamptz;
  next_due_tz text;
  next_gradable boolean;
  next_points numeric(8,2);
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
    if jsonb_exists(p_placement, 'work_type') then
      next_work_type := nullif(p_placement->>'work_type', '');
      if next_work_type is null or next_work_type not in ('material', 'assignment') then
        raise exception 'That material type isn’t supported.'
          using errcode = '23514';
      end if;
    else
      next_work_type := material.work_type;
    end if;
    if jsonb_exists(p_placement, 'scheduled_date') then
      next_scheduled := nullif(p_placement->>'scheduled_date', '')::date;
    else
      next_scheduled := material.scheduled_date;
    end if;
    if jsonb_exists(p_placement, 'due_date') then
      next_due := nullif(p_placement->>'due_date', '')::date;
    else
      next_due := material.due_date;
    end if;
    if jsonb_exists(p_placement, 'accept_submissions') then
      next_accept := coalesce((p_placement->>'accept_submissions')::boolean, false);
    else
      next_accept := material.accept_submissions;
    end if;
    if jsonb_exists(p_placement, 'allow_submissions_past_due') then
      next_allow_past := coalesce((p_placement->>'allow_submissions_past_due')::boolean, true);
    else
      next_allow_past := material.allow_submissions_past_due;
    end if;
    if jsonb_exists(p_placement, 'submission_limit') then
      next_limit := coalesce((p_placement->>'submission_limit')::int, material.submission_limit);
    else
      next_limit := material.submission_limit;
    end if;
    if jsonb_exists(p_placement, 'submission_file_types')
       and jsonb_typeof(p_placement->'submission_file_types') = 'array' then
      select coalesce(array_agg(value), '{}'::text[])
      into next_types
      from jsonb_array_elements_text(p_placement->'submission_file_types') as value;
    else
      next_types := material.submission_file_types;
    end if;
    if next_due is null then
      next_due_at := null;
      next_due_tz := null;
    else
      if jsonb_exists(p_placement, 'due_at') then
        next_due_at := nullif(p_placement->>'due_at', '')::timestamptz;
      else
        next_due_at := material.due_at;
      end if;
      if jsonb_exists(p_placement, 'due_timezone') then
        next_due_tz := nullif(p_placement->>'due_timezone', '');
      else
        next_due_tz := material.due_timezone;
      end if;
    end if;
    if not next_accept then
      next_gradable := false;
      next_points := null;
    elsif jsonb_exists(p_placement, 'gradable') then
      next_gradable := coalesce((p_placement->>'gradable')::boolean, false);
      if next_gradable then
        next_points := nullif(p_placement->>'points_possible', '')::numeric;
      else
        next_points := null;
      end if;
    else
      next_gradable := material.gradable;
      next_points := material.points_possible;
    end if;

    if next_work_type = 'material' then
      next_due := null;
      next_due_at := null;
      next_due_tz := null;
      next_accept := false;
      next_gradable := false;
      next_points := null;
    end if;

    if next_accept and coalesce(cardinality(next_types), 0) = 0 then
      raise exception 'Choose at least one kind of file families can turn in.'
        using errcode = '23514';
    end if;
    if next_limit < 1 or next_limit > 10 then
      raise exception 'Submissions allowed must be from 1 to 10.'
        using errcode = '23514';
    end if;
    if exists (
      select 1
      from unnest(coalesce(next_types, '{}'::text[])) as kind
      where kind not in ('pdf', 'image', 'document', 'audio', 'video')
    ) then
      raise exception 'That file type isn’t one families can turn in.'
        using errcode = '23514';
    end if;
    if next_due_at is not null and next_due_tz is null then
      raise exception 'Choose a timezone for the due time.'
        using errcode = '23514';
    end if;
    if next_gradable and (
      next_points is null or next_points <= 0 or next_points > 9999.99
    ) then
      raise exception 'Possible points must be greater than 0.'
        using errcode = '23514';
    end if;

    placement_changed :=
      next_title is distinct from material.title
      or next_description is distinct from material.description
      or next_url is distinct from material.url
      or next_work_type is distinct from material.work_type
      or next_scheduled is distinct from material.scheduled_date
      or next_due is distinct from material.due_date
      or next_accept is distinct from material.accept_submissions
      or next_allow_past is distinct from material.allow_submissions_past_due
      or next_limit is distinct from material.submission_limit
      or next_types is distinct from material.submission_file_types
      or next_due_at is distinct from material.due_at
      or next_due_tz is distinct from material.due_timezone
      or next_gradable is distinct from material.gradable
      or next_points is distinct from material.points_possible;
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
      work_type = next_work_type,
      scheduled_date = next_scheduled,
      due_date = next_due,
      accept_submissions = next_accept,
      allow_submissions_past_due = next_allow_past,
      submission_limit = next_limit,
      submission_file_types = coalesce(next_types, '{}'::text[]),
      due_at = next_due_at,
      due_timezone = next_due_tz,
      gradable = next_gradable,
      points_possible = next_points
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

comment on function public.save_material_page(bigint, jsonb, jsonb) is
  'Save material placement and/or page blocks; insert one material_versions row only when something changed. work_type material clears due date and submissions.';
