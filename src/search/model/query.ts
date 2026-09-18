const MIN_QUERY_LENGTH = 1;
const RESULT_LIMIT = 8;

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isSearchableQuery(query: string): boolean {
  return normalizeSearchQuery(query).length >= MIN_QUERY_LENGTH;
}

/** PostgREST `to_tsquery` (not `plfts` / `plainto_tsquery`, which ignores `:*`). */
export const SEARCH_VECTOR_FTS_OPERATOR = "fts(english)" as const;

/**
 * Build a prefix `to_tsquery` string from user input.
 * Only alphanumeric tokens are kept so operators cannot leak into `to_tsquery`.
 * Callers must filter with {@link SEARCH_VECTOR_FTS_OPERATOR} so `frac:*` is honored.
 */
export function toPrefixTsQuery(query: string): string | null {
  const terms = normalizeSearchQuery(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 0);
  if (terms.length === 0) return null;
  return terms.map((term) => `${term}:*`).join(" & ");
}

/** Filter args for prefix FTS. `plfts` / `.textSearch({ config })` would drop `:*`. */
export function prefixSearchVectorFilter(query: string): {
  column: "search_vector";
  operator: typeof SEARCH_VECTOR_FTS_OPERATOR;
  value: string;
} | null {
  const value = toPrefixTsQuery(query);
  if (!value) return null;
  return {
    column: "search_vector",
    operator: SEARCH_VECTOR_FTS_OPERATOR,
    value,
  };
}

export function searchResultLimit(): number {
  return RESULT_LIMIT;
}
