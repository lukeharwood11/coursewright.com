# AGENTS — `src/search/databridge/`

PostgREST FTS for searchable org entities. Filter `search_vector` under RLS (`textSearch`, english config, prefix `to_tsquery` from `model/query`). File hits resolve to a material the actor can already open — never invent a file-only route.
