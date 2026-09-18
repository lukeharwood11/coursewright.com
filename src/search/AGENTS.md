# AGENTS — `src/search/`

Cross-facet find (“where is this resource?”) — staff chrome search for now.

## Scope

- Org top-bar search (staff): pages, courses, materials
- Future: facets, files, units, roster people, families; dedicated route vs overlay TBD

## Rules

- RLS-respecting results only — query via `databridge/`, never invent access.
- Keep chrome search thin; ranking / merge logic lives in `model/`.
- Do not invent a `/search` route until [URLS.md](../../docs/URLS.md) locks it.

## Don’t

- Put course/roster business rules here beyond findability.
- Ship parent search until FEATURES says so.
