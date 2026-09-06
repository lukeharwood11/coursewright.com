# AGENTS — `src/units/`

Optional **units** group materials. Materials may also be course top-level (`unit_id` null). Optional unit dates. Order via `position`.

## Scope

- Unit create/reorder/rename
- Optional start/end dates
- **Print unit** entry point (compose `print/`)
- Lineage / override flags consistent with materials (**P1** template sync; P0 course-from-course is independent)

## Rules

- Units are **optional** — do not require every material to have a unit.
- Top-level materials (no unit) live on the **course** surface, above the units list — compose with `courses/` / `materials/`.
- Parent “this week” is calendar Sunday–Saturday — unit dates only apply to materials in that unit.
- Domain databridge for unit CRUD; print behavior stays in `print/`.

## Don’t

- Force units to map 1:1 to calendar weeks.
- Implement whole-course print (out of scope for initial release).
- Require a unit to add a material.
