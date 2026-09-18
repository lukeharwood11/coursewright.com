# AGENTS — `src/search/`

Cross-facet find (“where is this resource?”) — staff chrome search for now.

## Scope

- Org top-bar search (staff only): pages, courses, units, materials, files
- Postgres FTS via existing `search_vector` GIN indexes (PostgREST `textSearch`)
- Thin type facet in the overlay (all / page / course / unit / material / file)
- Future: more facets (kind, grade, dates, important now), `ts_rank`, page-body text, roster people / families; dedicated route vs overlay TBD

## Rules

- RLS-respecting results only — query via `databridge/`, never invent access.
- Keep chrome search thin; ranking / merge / query shaping lives in `model/`.
- Do not invent a `/search` route until [URLS.md](../../docs/URLS.md) locks it.
- Do not search roster people or families until that slice is explicitly in scope.

## Don’t

- Put course/roster business rules here beyond findability.
- Ship parent search until FEATURES says so.
