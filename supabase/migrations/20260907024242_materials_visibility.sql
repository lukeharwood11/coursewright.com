-- Material visibility: unpublished is staff-only; published is for enrolled parents
-- (and students when that role exists). Existing rows stay published so current
-- parent content does not disappear. New materials default to unpublished.

alter table public.materials
  add column visibility text not null default 'published';

alter table public.materials
  alter column visibility set default 'unpublished';

alter table public.materials
  add constraint materials_visibility_chk
  check (visibility in ('published', 'unpublished'));

create index materials_course_published_idx
  on public.materials (course_id)
  where deleted_at is null and visibility = 'published';

comment on column public.materials.visibility is
  'published = enrolled parents (and students later); unpublished = instructors/admins only';

create or replace function private.parent_can_view_material(p_material_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.materials m
    where m.id = p_material_id
      and m.course_id is not null
      and m.deleted_at is null
      and m.visibility = 'published'
      and private.parent_can_view_course(m.course_id)
  );
$$;

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
  );
$$;

grant execute on function private.parent_can_view_material(bigint)
  to authenticated, service_role;
grant execute on function private.parent_can_view_file(bigint)
  to authenticated, service_role;

drop policy if exists materials_select on public.materials;
create policy materials_select on public.materials
for select to authenticated
using (
  (course_id is not null and (
    (select private.is_org_staff(organization_id))
    or (select private.parent_can_view_material(id))
  ))
  or (template_id is not null and (select private.can_view_template(template_id)))
);

drop policy if exists blocks_select on public.blocks;
create policy blocks_select on public.blocks
for select to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (
          (select private.is_org_staff(m.organization_id))
          or (select private.parent_can_view_material(m.id))
        ))
        or (m.template_id is not null and (select private.can_view_template(m.template_id)))
      )
  )
);

drop policy if exists material_versions_select on public.material_versions;
create policy material_versions_select on public.material_versions
for select to authenticated
using (
  exists (
    select 1
    from public.materials m
    where m.id = material_id
      and (
        (m.course_id is not null and (
          (select private.is_org_staff(m.organization_id))
          or (select private.parent_can_view_material(m.id))
        ))
        or (m.template_id is not null and (select private.can_view_template(m.template_id)))
      )
  )
);

drop policy if exists important_now_select on public.important_now;
create policy important_now_select on public.important_now
for select to authenticated
using (
  (select private.is_org_staff(organization_id))
  or (select private.parent_can_view_material(material_id))
);
