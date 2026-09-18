export const SEARCH_RESULT_TYPES = ["page", "course", "material"] as const;
export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  href: string;
};

const TYPE_ORDER: readonly SearchResultType[] = SEARCH_RESULT_TYPES;

export function searchResultTypeLabel(type: SearchResultType): string {
  if (type === "page") return "Page";
  if (type === "course") return "Course";
  return "Material";
}

export function mergeSearchResults(groups: SearchResult[][]): SearchResult[] {
  return groups.flat();
}

/** Stable chrome order: type, then title-contains-query, then title. Not Postgres `ts_rank`. */
export function rankSearchResults(
  results: SearchResult[],
  query: string,
): SearchResult[] {
  const needle = query.trim().toLowerCase();
  return [...results].sort((a, b) => {
    const typeDiff = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
    if (typeDiff !== 0) return typeDiff;
    if (needle) {
      const aHit = a.title.toLowerCase().includes(needle) ? 0 : 1;
      const bHit = b.title.toLowerCase().includes(needle) ? 0 : 1;
      if (aHit !== bHit) return aHit - bHit;
    }
    return a.title.localeCompare(b.title);
  });
}
