-- Split resource audience into independent parent and student flags.
-- Existing presets that already let family viewers in (parents, members) stay
-- open to both so nobody loses access. Staff and restricted stay closed.

alter table public.org_resource_folders
  add column parents_can_view boolean not null default false,
  add column students_can_view boolean not null default false;

alter table public.org_resource_items
  add column parents_can_view boolean not null default false,
  add column students_can_view boolean not null default false;

update public.org_resource_folders
set
  parents_can_view = access_mode in ('parents', 'members'),
  students_can_view = access_mode in ('parents', 'members');

update public.org_resource_items
set
  parents_can_view = access_mode in ('parents', 'members'),
  students_can_view = access_mode in ('parents', 'members');

alter table public.org_resource_folders
  drop constraint org_resource_folders_access_mode_chk,
  drop column access_mode;

alter table public.org_resource_items
  drop constraint org_resource_items_access_mode_chk,
  drop column access_mode;

create or replace function private.org_resource_audience_allows_read(
  p_org_id bigint,
  p_parents_can_view boolean,
  p_students_can_view boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      p_parents_can_view
      and exists (
        select 1
        from public.memberships m
        where m.organization_id = p_org_id
          and m.user_id = (select auth.uid())
          and m.role = 'parent'
          and m.status = 'active'
      )
    )
    or (
      p_students_can_view
      and exists (
        select 1
        from public.memberships m
        where m.organization_id = p_org_id
          and m.user_id = (select auth.uid())
          and m.role = 'student'
          and m.status = 'active'
      )
    );
$$;

create or replace function private.can_view_org_resource_folder(p_folder_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder public.org_resource_folders%rowtype;
  source_id bigint;
  parents_can_view boolean;
  students_can_view boolean;
begin
  select * into folder from public.org_resource_folders where id = p_folder_id;
  if not found then
    return false;
  end if;
  if private.can_edit_org_resource_folder(folder.id) then
    return true;
  end if;
  if folder.archived_at is not null then
    return false;
  end if;
  if not private.is_org_member(folder.organization_id) then
    return false;
  end if;
  source_id := private.org_resource_acl_source_folder(folder.id);
  select f.parents_can_view, f.students_can_view
    into parents_can_view, students_can_view
  from public.org_resource_folders f
  where f.id = source_id;
  if private.org_resource_has_grant(source_id, null, false) then
    return true;
  end if;
  return private.org_resource_audience_allows_read(
    folder.organization_id,
    parents_can_view,
    students_can_view
  );
end;
$$;

create or replace function private.can_view_org_resource_item(p_item_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  item public.org_resource_items%rowtype;
  source_id bigint;
  parents_can_view boolean;
  students_can_view boolean;
begin
  select * into item from public.org_resource_items where id = p_item_id;
  if not found then
    return false;
  end if;
  if private.can_edit_org_resource_item(item.id) then
    return true;
  end if;
  if item.archived_at is not null then
    return false;
  end if;
  if item.visibility is distinct from 'published' then
    return false;
  end if;
  if not private.is_org_member(item.organization_id) then
    return false;
  end if;
  if item.acl_inherit is not true then
    if private.org_resource_has_grant(null, item.id, false) then
      return true;
    end if;
    return private.org_resource_audience_allows_read(
      item.organization_id,
      item.parents_can_view,
      item.students_can_view
    );
  end if;
  if item.folder_id is null then
    return false;
  end if;
  source_id := private.org_resource_acl_source_folder(item.folder_id);
  select f.parents_can_view, f.students_can_view
    into parents_can_view, students_can_view
  from public.org_resource_folders f
  where f.id = source_id;
  if private.org_resource_has_grant(source_id, null, false) then
    return true;
  end if;
  return private.org_resource_audience_allows_read(
    item.organization_id,
    parents_can_view,
    students_can_view
  );
end;
$$;

grant execute on function private.org_resource_audience_allows_read(bigint, boolean, boolean)
  to authenticated, service_role;

drop function if exists private.org_resource_mode_allows_read(bigint, text);
