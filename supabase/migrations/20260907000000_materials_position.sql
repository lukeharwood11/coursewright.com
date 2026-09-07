-- Materials need a stable order for unit packets and top-level lists.
-- SCHEMA.md Material.position; PRINT.md prints materials in position order.

alter table public.materials
  add column position int not null default 0;

create index materials_unit_position_idx
  on public.materials (unit_id, position)
  where deleted_at is null;

create index materials_course_toplevel_position_idx
  on public.materials (course_id, position)
  where unit_id is null and deleted_at is null;
