-- Lesson-plan day shortcuts to org Resources the course already links.
-- Linking a day does not publish, share, or grant access.

create table public.lesson_plan_day_resources (
  id bigserial primary key,
  lesson_plan_day_id bigint not null references public.lesson_plan_days (id) on delete cascade,
  folder_id bigint references public.org_resource_folders (id) on delete cascade,
  item_id bigint references public.org_resource_items (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint lesson_plan_day_resources_target_xor_chk check (
    (folder_id is not null and item_id is null)
    or (folder_id is null and item_id is not null)
  )
);

create unique index lesson_plan_day_resources_day_folder_key
  on public.lesson_plan_day_resources (lesson_plan_day_id, folder_id)
  where folder_id is not null;
create unique index lesson_plan_day_resources_day_item_key
  on public.lesson_plan_day_resources (lesson_plan_day_id, item_id)
  where item_id is not null;
create index lesson_plan_day_resources_day_id_idx
  on public.lesson_plan_day_resources (lesson_plan_day_id, position);

comment on table public.lesson_plan_day_resources is
  'SCHEMA.md LessonPlanDayResource — course-linked org Resources listed under a lesson-plan day';

-- True when this course already links the item or folder, or links a folder
-- that contains it. A folder link does not insert child rows; children are
-- only eligible. Walks org_resource_folders.parent_id. Not "anywhere in the org".
create or replace function private.resource_is_linked_on_course(
  p_course_id bigint,
  p_folder_id bigint,
  p_item_id bigint
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  walk bigint;
  guard int := 0;
begin
  if p_item_id is not null then
    if exists (
      select 1
      from public.course_resource_links l
      where l.course_id = p_course_id
        and l.item_id = p_item_id
    ) then
      return true;
    end if;

    select i.folder_id into walk
    from public.org_resource_items i
    where i.id = p_item_id;
    if not found then
      return false;
    end if;
  elsif p_folder_id is not null then
    if exists (
      select 1
      from public.course_resource_links l
      where l.course_id = p_course_id
        and l.folder_id = p_folder_id
    ) then
      return true;
    end if;

    select f.parent_id into walk
    from public.org_resource_folders f
    where f.id = p_folder_id;
    if not found then
      return false;
    end if;
  else
    return false;
  end if;

  while walk is not null loop
    guard := guard + 1;
    if guard > 32 then
      return false;
    end if;

    if exists (
      select 1
      from public.course_resource_links l
      where l.course_id = p_course_id
        and l.folder_id = walk
    ) then
      return true;
    end if;

    select f.parent_id into walk
    from public.org_resource_folders f
    where f.id = walk;
    if not found then
      return false;
    end if;
  end loop;

  return false;
end;
$$;

revoke all on function private.resource_is_linked_on_course(bigint, bigint, bigint) from public;
grant execute on function private.resource_is_linked_on_course(bigint, bigint, bigint) to authenticated, service_role;

create or replace function private.lesson_plan_day_resource_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  plan_course bigint;
  plan_org bigint;
  target_org bigint;
begin
  select lp.course_id, lp.organization_id
    into plan_course, plan_org
  from public.lesson_plan_days d
  join public.lesson_plans lp on lp.id = d.lesson_plan_id
  where d.id = new.lesson_plan_day_id;

  if not found then
    raise exception 'That day isn’t available.'
      using errcode = '23514';
  end if;

  if new.folder_id is not null then
    select f.organization_id into target_org
    from public.org_resource_folders f
    where f.id = new.folder_id
      and f.archived_at is null;
    if not found then
      raise exception 'That folder isn’t available.'
        using errcode = '23514';
    end if;
  else
    select i.organization_id into target_org
    from public.org_resource_items i
    where i.id = new.item_id
      and i.archived_at is null;
    if not found then
      raise exception 'That resource isn’t available.'
        using errcode = '23514';
    end if;
  end if;

  if target_org is distinct from plan_org then
    raise exception 'Resource must belong to the same organization as the course.'
      using errcode = '23514';
  end if;

  if not private.resource_is_linked_on_course(plan_course, new.folder_id, new.item_id) then
    raise exception 'Link that resource on the course before adding it to a lesson plan.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger lesson_plan_day_resources_before_write
before insert or update on public.lesson_plan_day_resources
for each row execute function private.lesson_plan_day_resource_before_write();

grant select, insert, update, delete on table public.lesson_plan_day_resources to authenticated;
grant select, insert, update, delete on table public.lesson_plan_day_resources to service_role;
grant usage, select on sequence public.lesson_plan_day_resources_id_seq to authenticated, service_role;

alter table public.lesson_plan_day_resources enable row level security;

create policy lesson_plan_day_resources_select on public.lesson_plan_day_resources
for select to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (
        (select private.is_org_staff(lp.organization_id))
        or (
          lp.deleted_at is null
          and lp.visibility = 'published'
          and (select private.parent_can_view_course(lp.course_id))
        )
      )
  )
);

create policy lesson_plan_day_resources_insert on public.lesson_plan_day_resources
for insert to authenticated
with check (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and lp.deleted_at is null
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_resources_update on public.lesson_plan_day_resources
for update to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
)
with check (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
);

create policy lesson_plan_day_resources_delete on public.lesson_plan_day_resources
for delete to authenticated
using (
  exists (
    select 1
    from public.lesson_plan_days d
    join public.lesson_plans lp on lp.id = d.lesson_plan_id
    where d.id = lesson_plan_day_id
      and (select private.can_manage_course(lp.course_id))
  )
);
