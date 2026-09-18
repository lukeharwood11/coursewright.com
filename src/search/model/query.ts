const MIN_QUERY_LENGTH = 1;
const RESULT_LIMIT_ALL = 5;
const RESULT_LIMIT_TYPED = 8;

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isSearchableQuery(query: string): boolean {
  return normalizeSearchQuery(query).length >= MIN_QUERY_LENGTH;
}

/**
 * Build a prefix `to_tsquery` string from user input.
 * Only alphanumeric tokens are kept so operators cannot leak into `to_tsquery`.
 */
export function toPrefixTsQuery(query: string): string | null {
  const terms = normalizeSearchQuery(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 0);
  if (terms.length === 0) return null;
  return terms.map((term) => `${term}:*`).join(" & ");
}

export function searchResultLimit(scopedToType: boolean): number {
  return scopedToType ? RESULT_LIMIT_TYPED : RESULT_LIMIT_ALL;
}
