const MIN_QUERY_LENGTH = 1;
const RESULT_LIMIT = 8;

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isSearchableQuery(query: string): boolean {
  return normalizeSearchQuery(query).length >= MIN_QUERY_LENGTH;
}

/** Escape `%` / `_` so ilike patterns stay literal. */
export function toIlikePattern(query: string): string {
  const escaped = normalizeSearchQuery(query)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  return `%${escaped}%`;
}

export function searchResultLimit(): number {
  return RESULT_LIMIT;
}
