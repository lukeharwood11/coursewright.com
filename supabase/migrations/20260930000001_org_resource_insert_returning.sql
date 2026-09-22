-- PostgREST INSERT … RETURNING must pass SELECT USING on the new tuple.
-- can_view_org_resource_folder(id) / can_view_org_resource_item(id) re-read the
-- row by id; that nested scan cannot see the in-flight insert (same command),
-- so staff got "new row violates row-level security policy".
-- Same pattern as 20260922000002_discussions_parent_insert_returning.sql and
-- 20260928000001_courses_insert_returning.sql.

create or replace function private.can_edit_org_resource_folder(p_folder_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder public.org_resource_folders%rowtype;
  source_id bigint;
begin
  select * into folder from public.org_resource_folders where id = p_folder_id;
  if not found then
    return false;
  end if;
  if private.is_org_staff(folder.organization_id) then
    return true;
  end if;
  if folder.created_by is not distinct from (select auth.uid()) then
    return true;
  end if;
  source_id := private.org_resource_acl_source_folder(folder.id);
  return private.org_resource_has_grant(source_id, null, true);
end;
$$;

create or replace function private.can_edit_org_resource_item(p_item_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  item public.org_resource_items%rowtype;
  source_id bigint;
begin
  select * into item from public.org_resource_items where id = p_item_id;
  if not found then
    return false;
  end if;
  if private.is_org_staff(item.organization_id) then
    return true;
  end if;
  if item.created_by is not distinct from (select auth.uid()) then
    return true;
  end if;
  if item.acl_inherit is not true then
    return private.org_resource_has_grant(null, item.id, true);
  end if;
  if item.folder_id is null then
    return false;
  end if;
  source_id := private.org_resource_acl_source_folder(item.folder_id);
  return private.org_resource_has_grant(source_id, null, true);
end;
$$;

drop policy if exists org_resource_folders_select on public.org_resource_folders;
create policy org_resource_folders_select on public.org_resource_folders
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or created_by = (select auth.uid())
  or (select private.can_view_org_resource_folder(id))
);

drop policy if exists org_resource_items_select on public.org_resource_items;
create policy org_resource_items_select on public.org_resource_items
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or created_by = (select auth.uid())
  or (select private.can_view_org_resource_item(id))
);
