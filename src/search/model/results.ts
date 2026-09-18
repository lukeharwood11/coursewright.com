export const SEARCH_RESULT_TYPES = [
  "page",
  "course",
  "unit",
  "material",
  "file",
] as const;
export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export const SEARCH_TYPE_FILTERS = ["all", ...SEARCH_RESULT_TYPES] as const;
export type SearchTypeFilter = (typeof SEARCH_TYPE_FILTERS)[number];

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  href: string;
  detail?: string;
};

const TYPE_ORDER: readonly SearchResultType[] = SEARCH_RESULT_TYPES;

export function searchResultTypeLabel(type: SearchResultType): string {
  if (type === "page") return "Page";
  if (type === "course") return "Course";
  if (type === "unit") return "Unit";
  if (type === "file") return "File";
  return "Material";
}

export function searchTypeFilterLabel(filter: SearchTypeFilter): string {
  if (filter === "all") return "All";
  return searchResultTypeLabel(filter);
}

export function includesSearchType(
  filter: SearchTypeFilter,
  type: SearchResultType,
): boolean {
  return filter === "all" || filter === type;
}

export function mergeSearchResults(groups: SearchResult[][]): SearchResult[] {
  return groups.flat();
}

/** Stable chrome order: type, then title-contains-query, then title. Not Postgres `ts_rank`. */
export function rankSearchResults(
  results: SearchResult[],
  query: string,
): SearchResult[] {
  const needle = normalizeNeedle(query);
  return [...results].sort((a, b) => {
    const typeDiff = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
    if (typeDiff !== 0) return typeDiff;
    if (needle) {
      const hitDiff = titleHit(a, needle) - titleHit(b, needle);
      if (hitDiff !== 0) return hitDiff;
    }
    return a.title.localeCompare(b.title);
  });
}

function normalizeNeedle(query: string): string {
  return query.trim().toLowerCase();
}

function titleHit(result: SearchResult, needle: string): number {
  const haystack = `${result.title} ${result.detail ?? ""}`.toLowerCase();
  return haystack.includes(needle) ? 0 : 1;
}
