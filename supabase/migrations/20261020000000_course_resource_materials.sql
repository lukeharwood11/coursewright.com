-- Resource links are materials in one Resources unit per course.
-- Replaces course_resource_links. Drops the unmerged lesson-plan day-resource
-- table if a local database already applied that earlier draft.

drop table if exists public.lesson_plan_day_resources;
drop function if exists private.lesson_plan_day_resource_before_write();
drop function if exists private.resource_is_linked_on_course(bigint, bigint, bigint);

alter table public.units
  add column is_resources boolean not null default false;

comment on column public.units.is_resources is
  'The course Resources unit. Undated when created. Renaming, mixing other materials, and deleting are allowed.';

create unique index units_one_live_resources_unit_key
  on public.units (course_id)
  where is_resources and deleted_at is null and course_id is not null;

alter table public.materials
  drop constraint materials_kind_chk;

alter table public.materials
  add constraint materials_kind_chk
    check (kind in ('page', 'link', 'file', 'resource'));

alter table public.materials
  add column resource_folder_id bigint
    references public.org_resource_folders (id) on delete cascade,
  add column resource_item_id bigint
    references public.org_resource_items (id) on delete cascade;

alter table public.materials
  add constraint materials_resource_target_chk check (
    (
      kind = 'resource'
      and work_type = 'material'
      and url is null
      and file_id is null
      and (
        (resource_folder_id is not null and resource_item_id is null)
        or (resource_folder_id is null and resource_item_id is not null)
      )
    )
    or (
      kind <> 'resource'
      and resource_folder_id is null
      and resource_item_id is null
    )
  );

create unique index materials_course_resource_folder_key
  on public.materials (course_id, resource_folder_id)
  where kind = 'resource'
    and resource_folder_id is not null
    and deleted_at is null;

create unique index materials_course_resource_item_key
  on public.materials (course_id, resource_item_id)
  where kind = 'resource'
    and resource_item_id is not null
    and deleted_at is null;

comment on column public.materials.resource_folder_id is
  'Set only when kind = resource. The folder itself, not its children.';
comment on column public.materials.resource_item_id is
  'Set only when kind = resource. Publishing this row does not share the file.';

create or replace function private.material_resource_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.kind <> 'resource' or new.deleted_at is not null then
    return new;
  end if;

  if new.course_id is null then
    raise exception 'Resource materials belong on a course.'
      using errcode = '23514';
  end if;

  if new.resource_folder_id is not null then
    select f.organization_id into target_org
    from public.org_resource_folders f
    where f.id = new.resource_folder_id
      and f.archived_at is null;
    if not found then
      raise exception 'That folder isn’t available.'
        using errcode = '23514';
    end if;
  else
    select i.organization_id into target_org
    from public.org_resource_items i
    where i.id = new.resource_item_id
      and i.archived_at is null;
    if not found then
      raise exception 'That resource isn’t available.'
        using errcode = '23514';
    end if;
  end if;

  if target_org is distinct from new.organization_id then
    raise exception 'Resource must belong to the same organization as the course.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger materials_resource_before_write
before insert or update on public.materials
for each row execute function private.material_resource_before_write();

create or replace function private.courses_insert_resources_unit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.units (
    organization_id,
    course_id,
    title,
    start_date,
    end_date,
    position,
    is_resources
  ) values (
    new.organization_id,
    new.id,
    'Resources',
    null,
    null,
    coalesce(
      (
        select max(u.position) + 1
        from public.units u
        where u.course_id = new.id
          and u.deleted_at is null
      ),
      0
    ),
    true
  );
  return new;
end;
$$;

create trigger courses_insert_resources_unit
after insert on public.courses
for each row execute function private.courses_insert_resources_unit();

-- Reuse one undated unit already titled Resources. Otherwise append.
update public.units u
set is_resources = true
from (
  select distinct on (course_id) id
  from public.units
  where deleted_at is null
    and course_id is not null
    and start_date is null
    and end_date is null
    and title = 'Resources'
  order by course_id, position, id
) picked
where u.id = picked.id;

insert into public.units (
  organization_id,
  course_id,
  title,
  start_date,
  end_date,
  position,
  is_resources
)
select
  c.organization_id,
  c.id,
  'Resources',
  null,
  null,
  coalesce(
    (
      select max(u.position) + 1
      from public.units u
      where u.course_id = c.id
        and u.deleted_at is null
    ),
    0
  ),
  true
from public.courses c
where not exists (
  select 1
  from public.units u
  where u.course_id = c.id
    and u.is_resources
    and u.deleted_at is null
);

insert into public.materials (
  organization_id,
  course_id,
  unit_id,
  title,
  description,
  kind,
  work_type,
  resource_folder_id,
  resource_item_id,
  position,
  visibility
)
select
  l.organization_id,
  l.course_id,
  ru.id,
  coalesce(f.name, i.title, 'Resource'),
  '',
  'resource',
  'material',
  l.folder_id,
  l.item_id,
  coalesce(existing.max_position, -1) + row_number() over (
    partition by l.course_id
    order by l.sort_order, l.id
  ),
  'published'
from public.course_resource_links l
join public.units ru
  on ru.course_id = l.course_id
 and ru.is_resources
 and ru.deleted_at is null
left join public.org_resource_folders f on f.id = l.folder_id
left join public.org_resource_items i on i.id = l.item_id
left join lateral (
  select max(m.position) as max_position
  from public.materials m
  where m.unit_id = ru.id
    and m.deleted_at is null
) existing on true
where (l.folder_id is not null and f.id is not null and f.archived_at is null)
   or (l.item_id is not null and i.id is not null and i.archived_at is null);

drop table public.course_resource_links;
drop function if exists private.course_resource_link_before_write();
