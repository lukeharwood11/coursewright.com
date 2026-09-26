# AGENTS — `src/search/`

Cross-facet find (“where is this resource?”) — org chrome search for all members.

## Scope (this slice)

- Org top-bar search (all org members): pages, courses, materials
- Postgres FTS via existing `search_vector` GIN indexes (PostgREST `fts(english)` / `to_tsquery`, so `frac:*` prefixes work)
- Overlay cards only — no `/search` route until [URLS.md](../../docs/URLS.md) locks it
- Hits are **findability only**. They never grant access. Enrollment / `parent_student_links` remain the access gate.

## Deferred

Facets, files, units, roster people / families, page-body text, `ts_rank`, dedicated search service (Algolia / Elastic / side index).

## Rules

- RLS-respecting results only — query via `databridge/`, never invent access.
- Keep chrome search thin; ranking / merge / query shaping lives in `model/`.
- Do not invent a `/search` route until URLS locks it.

## Don’t

- Put course/roster business rules here beyond findability.
- Expand facets beyond this slice without FEATURES / SCHEMA alignment.
- Add a dedicated search index unless FEATURES/STACK says FTS cannot meet the bar.
