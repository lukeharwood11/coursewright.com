# AGENTS — `src/search/databridge/`

PostgREST FTS for courses and materials. Filter `search_vector` under RLS (`textSearch`, english config, prefix `to_tsquery` from `model/query`). Search is findability only — do not invent an access path.
