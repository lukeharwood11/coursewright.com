# AGENTS — `src/units/`

Optional **units** group materials. Materials may also be course top-level (`unit_id` null). Optional unit dates. Order via `position`.

## Scope

- Unit create/reorder/rename
- Optional start/end dates
- **Print unit** entry point (compose `print/`)
- Lineage / override flags consistent with materials (**P1** template sync; P0 course-from-course is independent)

## Rules

- Units are **optional** in the database — existing materials may have `unit_id` null.
- New materials are added **on a unit** in the UI (no course-level Add material). Top-level materials still show on the **course** surface when present.
- Parent “this week” is calendar Sunday–Saturday — unit dates only apply to materials in that unit.
- Domain databridge for unit CRUD; print behavior stays in `print/`.

## Don’t

- Force units to map 1:1 to calendar weeks.
- Implement whole-course print (out of scope for initial release).
- Require a unit in the database to store a material (the UI adds materials on a unit; `unit_id` may still be null).
