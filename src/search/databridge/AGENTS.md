# AGENTS — `src/search/databridge/`

PostgREST FTS for courses and materials. Filter `search_vector` with `fts(english)` (`to_tsquery`) under RLS so prefix `term:*` from `model/query` is honored. Do **not** use `.textSearch(..., { config: "english" })` — that path is `plainto_tsquery` / `plfts` and ignores `:*`. Search is findability only — do not invent an access path.
