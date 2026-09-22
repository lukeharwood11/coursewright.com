-- Org Resources (P1a): nested folders + document/link/file items.
-- Access is membership + folder/item ACL (not course enrollment).
-- Do not hang these off public.materials.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.org_resource_folders (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  parent_id bigint references public.org_resource_folders (id) on delete restrict,
  name text not null,
  description text,
  access_mode text not null default 'staff',
  acl_inherit boolean not null default true,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_resource_folders_name_chk check (char_length(btrim(name)) > 0),
  constraint org_resource_folders_name_len_chk check (char_length(name) <= 200),
  constraint org_resource_folders_description_len_chk
    check (description is null or char_length(description) <= 2000),
  constraint org_resource_folders_access_mode_chk check (
    access_mode in ('staff', 'parents', 'members', 'restricted')
  ),
  constraint org_resource_folders_root_acl_chk check (
    parent_id is not null or acl_inherit = false
  )
);

create index org_resource_folders_org_parent_idx
  on public.org_resource_folders (organization_id, parent_id)
  where archived_at is null;
create index org_resource_folders_parent_id_idx
  on public.org_resource_folders (parent_id);
create index org_resource_folders_created_by_idx
  on public.org_resource_folders (created_by);

comment on table public.org_resource_folders is
  'SCHEMA.md OrgResourceFolder — nested org resource folders with inherited ACL';

create trigger org_resource_folders_set_updated_at
before update on public.org_resource_folders
for each row execute function private.set_updated_at();

create table public.org_resource_items (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  folder_id bigint references public.org_resource_folders (id) on delete restrict,
  type text not null,
  title text not null,
  description text,
  url text,
  file_id bigint references public.files (id) on delete set null,
  visibility text not null default 'unpublished',
  acl_inherit boolean not null default true,
  access_mode text not null default 'staff',
  archived_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored,
  constraint org_resource_items_title_chk check (char_length(btrim(title)) > 0),
  constraint org_resource_items_title_len_chk check (char_length(title) <= 300),
  constraint org_resource_items_description_len_chk
    check (description is null or char_length(description) <= 2000),
  constraint org_resource_items_type_chk check (
    type in ('document', 'link', 'file')
  ),
  constraint org_resource_items_visibility_chk check (
    visibility in ('unpublished', 'published')
  ),
  constraint org_resource_items_access_mode_chk check (
    access_mode in ('staff', 'parents', 'members', 'restricted')
  ),
  constraint org_resource_items_payload_chk check (
    (type = 'document' and url is null)
    or (type = 'link' and url is not null and file_id is null)
    or (type = 'file' and file_id is not null and url is null)
  )
);

create index org_resource_items_org_folder_idx
  on public.org_resource_items (organization_id, folder_id)
  where archived_at is null;
create index org_resource_items_folder_id_idx
  on public.org_resource_items (folder_id);
create index org_resource_items_file_id_idx
  on public.org_resource_items (file_id);
create index org_resource_items_created_by_idx
  on public.org_resource_items (created_by);
create index org_resource_items_search_idx
  on public.org_resource_items using gin (search_vector);

comment on table public.org_resource_items is
  'SCHEMA.md OrgResourceItem — document, link, or file in an org resource folder';

create trigger org_resource_items_set_updated_at
before update on public.org_resource_items
for each row execute function private.set_updated_at();

create table public.org_resource_blocks (
  id bigserial primary key,
  item_id bigint not null references public.org_resource_items (id) on delete cascade,
  position int not null default 0,
  kind text not null,
  body jsonb not null default '{}'::jsonb,
  file_id bigint references public.files (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_resource_blocks_kind_chk check (kind in ('rich_text', 'video'))
);

create index org_resource_blocks_item_id_idx
  on public.org_resource_blocks (item_id);
create index org_resource_blocks_file_id_idx
  on public.org_resource_blocks (file_id);
create index org_resource_blocks_item_position_idx
  on public.org_resource_blocks (item_id, position)
  where deleted_at is null;

comment on table public.org_resource_blocks is
  'SCHEMA.md OrgResourceBlock — Lexical page body for document resource items';

create trigger org_resource_blocks_set_updated_at
before update on public.org_resource_blocks
for each row execute function private.set_updated_at();

create table public.org_resource_grants (
  id bigserial primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  folder_id bigint references public.org_resource_folders (id) on delete cascade,
  item_id bigint references public.org_resource_items (id) on delete cascade,
  grantee_user_id uuid not null references public.profiles (id) on delete cascade,
  permission text not null,
  created_at timestamptz not null default now(),
  constraint org_resource_grants_permission_chk check (
    permission in ('read', 'write')
  ),
  constraint org_resource_grants_target_xor_chk check (
    (folder_id is not null and item_id is null)
    or (folder_id is null and item_id is not null)
  )
);

create unique index org_resource_grants_folder_grantee_key
  on public.org_resource_grants (folder_id, grantee_user_id)
  where folder_id is not null;
create unique index org_resource_grants_item_grantee_key
  on public.org_resource_grants (item_id, grantee_user_id)
  where item_id is not null;
create index org_resource_grants_grantee_idx
  on public.org_resource_grants (grantee_user_id);
create index org_resource_grants_organization_id_idx
  on public.org_resource_grants (organization_id);

comment on table public.org_resource_grants is
  'SCHEMA.md OrgResourceGrant — extra read/write for a person on a folder or item';

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

create or replace function private.org_resource_folder_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  walk bigint;
  walk_org bigint;
  guard int := 0;
begin
  if new.parent_id is null then
    new.acl_inherit := false;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.parent_id = new.id then
    raise exception 'A folder can’t be inside itself.';
  end if;
  walk := new.parent_id;
  while walk is not null loop
    guard := guard + 1;
    if guard > 32 then
      raise exception 'Folder nesting is too deep.';
    end if;
    if tg_op = 'UPDATE' and walk = new.id then
      raise exception 'A folder can’t be moved inside itself.';
    end if;
    select f.parent_id, f.organization_id
      into walk, walk_org
    from public.org_resource_folders f
    where f.id = walk;
    if not found then
      raise exception 'That folder isn’t available.';
    end if;
    if walk_org is distinct from new.organization_id then
      raise exception 'Folder must stay in the same organization.';
    end if;
  end loop;
  return new;
end;
$$;

create trigger org_resource_folders_before_write
before insert or update of parent_id, organization_id, acl_inherit
on public.org_resource_folders
for each row execute function private.org_resource_folder_before_write();

create or replace function private.org_resource_item_same_org_folder()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  folder_org bigint;
begin
  if new.folder_id is null then
    return new;
  end if;
  select organization_id into folder_org
  from public.org_resource_folders
  where id = new.folder_id;
  if not found then
    raise exception 'That folder isn’t available.';
  end if;
  if folder_org is distinct from new.organization_id then
    raise exception 'Resource must stay in the same organization as its folder.';
  end if;
  return new;
end;
$$;

create trigger org_resource_items_same_org_folder
before insert or update of folder_id, organization_id
on public.org_resource_items
for each row execute function private.org_resource_item_same_org_folder();

create or replace function private.org_resource_blocks_require_document()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item_type text;
begin
  select i.type into item_type
  from public.org_resource_items i
  where i.id = new.item_id;
  if not found then
    raise exception 'Resource isn’t available.';
  end if;
  if item_type is distinct from 'document' then
    raise exception 'Blocks can only belong to document resources.';
  end if;
  return new;
end;
$$;

create trigger org_resource_blocks_require_document
before insert or update of item_id on public.org_resource_blocks
for each row execute function private.org_resource_blocks_require_document();

create or replace function private.org_resource_grant_same_org()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_org bigint;
begin
  if new.folder_id is not null then
    select organization_id into target_org
    from public.org_resource_folders
    where id = new.folder_id;
  else
    select organization_id into target_org
    from public.org_resource_items
    where id = new.item_id;
  end if;
  if not found then
    raise exception 'That resource isn’t available.';
  end if;
  if target_org is distinct from new.organization_id then
    raise exception 'Grant must stay in the same organization.';
  end if;
  if not exists (
    select 1
    from public.memberships m
    where m.organization_id = new.organization_id
      and m.user_id = new.grantee_user_id
      and m.status = 'active'
  ) then
    raise exception 'That person isn’t in this organization.';
  end if;
  return new;
end;
$$;

create trigger org_resource_grants_same_org
before insert or update on public.org_resource_grants
for each row execute function private.org_resource_grant_same_org();

-- ---------------------------------------------------------------------------
-- ACL helpers (SECURITY DEFINER — avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function private.is_org_parent_role(p_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role = 'parent'
      and m.status = 'active'
  );
$$;

create or replace function private.org_resource_acl_source_folder(p_folder_id bigint)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_id bigint := p_folder_id;
  inherit boolean;
  parent bigint;
  guard int := 0;
begin
  if p_folder_id is null then
    return null;
  end if;
  loop
    guard := guard + 1;
    if guard > 32 then
      return current_id;
    end if;
    select f.acl_inherit, f.parent_id
      into inherit, parent
    from public.org_resource_folders f
    where f.id = current_id;
    if not found then
      return current_id;
    end if;
    if inherit is not true or parent is null then
      return current_id;
    end if;
    current_id := parent;
  end loop;
end;
$$;

create or replace function private.org_resource_has_grant(
  p_folder_id bigint,
  p_item_id bigint,
  p_write boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.org_resource_grants g
    where g.grantee_user_id = (select auth.uid())
      and (
        (p_folder_id is not null and g.folder_id = p_folder_id)
        or (p_item_id is not null and g.item_id = p_item_id)
      )
      and (
        not p_write
        or g.permission = 'write'
      )
  );
$$;

create or replace function private.org_resource_mode_allows_read(
  p_org_id bigint,
  p_access_mode text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_access_mode
    when 'members' then private.is_org_member(p_org_id)
    when 'parents' then
      private.is_org_staff(p_org_id) or private.is_org_parent_role(p_org_id)
    when 'staff' then private.is_org_staff(p_org_id)
    else false
  end;
$$;

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
  source_id := private.org_resource_acl_source_folder(folder.id);
  return private.org_resource_has_grant(source_id, null, true);
end;
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
  source_mode text;
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
  select f.access_mode into source_mode
  from public.org_resource_folders f
  where f.id = source_id;
  if private.org_resource_has_grant(source_id, null, false) then
    return true;
  end if;
  return private.org_resource_mode_allows_read(folder.organization_id, source_mode);
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
  source_mode text;
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
    return private.org_resource_mode_allows_read(
      item.organization_id,
      item.access_mode
    );
  end if;
  if item.folder_id is null then
    return false;
  end if;
  source_id := private.org_resource_acl_source_folder(item.folder_id);
  select f.access_mode into source_mode
  from public.org_resource_folders f
  where f.id = source_id;
  if private.org_resource_has_grant(source_id, null, false) then
    return true;
  end if;
  return private.org_resource_mode_allows_read(item.organization_id, source_mode);
end;
$$;

create or replace function private.can_create_org_resource_in_folder(
  p_org_id bigint,
  p_folder_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_folder_id is null then private.is_org_staff(p_org_id)
    else private.can_edit_org_resource_folder(p_folder_id)
  end;
$$;

-- Parents (and granted editors) may read a file attached to a viewable resource.
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
  );
$$;

-- ---------------------------------------------------------------------------
-- Grants + RLS
-- ---------------------------------------------------------------------------

grant select, insert, update on table public.org_resource_folders to authenticated;
grant select, insert, update on table public.org_resource_items to authenticated;
grant select, insert, update on table public.org_resource_blocks to authenticated;
grant select, insert, update, delete on table public.org_resource_grants to authenticated;
grant select, insert, update, delete on table public.org_resource_folders to service_role;
grant select, insert, update, delete on table public.org_resource_items to service_role;
grant select, insert, update, delete on table public.org_resource_blocks to service_role;
grant select, insert, update, delete on table public.org_resource_grants to service_role;
grant usage, select on sequence public.org_resource_folders_id_seq to authenticated, service_role;
grant usage, select on sequence public.org_resource_items_id_seq to authenticated, service_role;
grant usage, select on sequence public.org_resource_blocks_id_seq to authenticated, service_role;
grant usage, select on sequence public.org_resource_grants_id_seq to authenticated, service_role;

grant execute on function private.is_org_parent_role(bigint) to authenticated, service_role;
grant execute on function private.org_resource_acl_source_folder(bigint) to authenticated, service_role;
grant execute on function private.org_resource_has_grant(bigint, bigint, boolean) to authenticated, service_role;
grant execute on function private.org_resource_mode_allows_read(bigint, text) to authenticated, service_role;
grant execute on function private.can_edit_org_resource_folder(bigint) to authenticated, service_role;
grant execute on function private.can_view_org_resource_folder(bigint) to authenticated, service_role;
grant execute on function private.can_edit_org_resource_item(bigint) to authenticated, service_role;
grant execute on function private.can_view_org_resource_item(bigint) to authenticated, service_role;
grant execute on function private.can_create_org_resource_in_folder(bigint, bigint) to authenticated, service_role;
grant execute on function private.parent_can_view_file(bigint) to authenticated, service_role;

alter table public.org_resource_folders enable row level security;
alter table public.org_resource_items enable row level security;
alter table public.org_resource_blocks enable row level security;
alter table public.org_resource_grants enable row level security;

create policy org_resource_folders_select on public.org_resource_folders
for select to authenticated
using ((select private.can_view_org_resource_folder(id)));

create policy org_resource_folders_insert on public.org_resource_folders
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_create_org_resource_in_folder(organization_id, parent_id))
);

create policy org_resource_folders_update on public.org_resource_folders
for update to authenticated
using ((select private.can_edit_org_resource_folder(id)))
with check ((select private.can_edit_org_resource_folder(id)));

create policy org_resource_items_select on public.org_resource_items
for select to authenticated
using ((select private.can_view_org_resource_item(id)));

create policy org_resource_items_insert on public.org_resource_items
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_create_org_resource_in_folder(organization_id, folder_id))
);

create policy org_resource_items_update on public.org_resource_items
for update to authenticated
using ((select private.can_edit_org_resource_item(id)))
with check ((select private.can_edit_org_resource_item(id)));

create policy org_resource_blocks_select on public.org_resource_blocks
for select to authenticated
using ((select private.can_view_org_resource_item(item_id)));

create policy org_resource_blocks_insert on public.org_resource_blocks
for insert to authenticated
with check ((select private.can_edit_org_resource_item(item_id)));

create policy org_resource_blocks_update on public.org_resource_blocks
for update to authenticated
using ((select private.can_edit_org_resource_item(item_id)))
with check ((select private.can_edit_org_resource_item(item_id)));

create policy org_resource_grants_select on public.org_resource_grants
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or grantee_user_id = (select auth.uid())
);

create policy org_resource_grants_insert on public.org_resource_grants
for insert to authenticated
with check ((select private.is_org_staff(organization_id)));

create policy org_resource_grants_update on public.org_resource_grants
for update to authenticated
using ((select private.is_org_staff(organization_id)))
with check ((select private.is_org_staff(organization_id)));

create policy org_resource_grants_delete on public.org_resource_grants
for delete to authenticated
using ((select private.is_org_staff(organization_id)));
