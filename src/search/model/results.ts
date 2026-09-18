export const SEARCH_RESULT_TYPES = ["page", "course", "material"] as const;
export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  href: string;
};

export function searchResultTypeLabel(type: SearchResultType): string {
  if (type === "page") return "Page";
  if (type === "course") return "Course";
  return "Material";
}

export function mergeSearchResults(groups: SearchResult[][]): SearchResult[] {
  return groups.flat();
}
