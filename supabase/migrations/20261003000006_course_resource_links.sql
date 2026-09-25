-- Course shortcuts to org Resources folders or items (not course materials).

create table public.course_resource_links (
  id bigserial primary key,
  course_id bigint not null references public.courses (id) on delete cascade,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  folder_id bigint references public.org_resource_folders (id) on delete cascade,
  item_id bigint references public.org_resource_items (id) on delete cascade,
  sort_order int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint course_resource_links_target_xor_chk check (
    (folder_id is not null and item_id is null)
    or (folder_id is null and item_id is not null)
  )
);

create unique index course_resource_links_course_folder_key
  on public.course_resource_links (course_id, folder_id)
  where folder_id is not null;
create unique index course_resource_links_course_item_key
  on public.course_resource_links (course_id, item_id)
  where item_id is not null;
create index course_resource_links_course_id_idx
  on public.course_resource_links (course_id, sort_order);

comment on table public.course_resource_links is
  'Shortcuts from a course to an org Resource folder or item';

create or replace function private.course_resource_link_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  course_org bigint;
  target_org bigint;
begin
  select c.organization_id into course_org
  from public.courses c
  where c.id = new.course_id;
  if not found then
    raise exception 'That course isn’t available.';
  end if;
  new.organization_id := course_org;

  if new.folder_id is not null then
    select f.organization_id into target_org
    from public.org_resource_folders f
    where f.id = new.folder_id
      and f.archived_at is null;
    if not found then
      raise exception 'That folder isn’t available.';
    end if;
  else
    select i.organization_id into target_org
    from public.org_resource_items i
    where i.id = new.item_id
      and i.archived_at is null;
    if not found then
      raise exception 'That resource isn’t available.';
    end if;
  end if;

  if target_org is distinct from course_org then
    raise exception 'Resource must belong to the same organization as the course.';
  end if;

  return new;
end;
$$;

create trigger course_resource_links_before_write
before insert or update on public.course_resource_links
for each row execute function private.course_resource_link_before_write();

grant select, insert, update, delete on table public.course_resource_links to authenticated;
grant select, insert, update, delete on table public.course_resource_links to service_role;
grant usage, select on sequence public.course_resource_links_id_seq to authenticated, service_role;

alter table public.course_resource_links enable row level security;

create policy course_resource_links_select on public.course_resource_links
for select to authenticated
using ((select private.can_view_course(course_id)));

create policy course_resource_links_insert on public.course_resource_links
for insert to authenticated
with check ((select private.can_manage_course(course_id)));

create policy course_resource_links_update on public.course_resource_links
for update to authenticated
using ((select private.can_manage_course(course_id)))
with check ((select private.can_manage_course(course_id)));

create policy course_resource_links_delete on public.course_resource_links
for delete to authenticated
using ((select private.can_manage_course(course_id)));
