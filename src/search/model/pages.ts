import type { SearchResult } from "./results";

/** Staff org destinations that appear as “Page” search hits. */
export function staffSearchPages(orgSlug: string): SearchResult[] {
  const base = `/my/${orgSlug}`;
  return [
    { id: "page:home", type: "page", title: "Home", href: base },
    {
      id: "page:courses",
      type: "page",
      title: "Courses",
      href: `${base}/courses`,
    },
    {
      id: "page:roster",
      type: "page",
      title: "Roster",
      href: `${base}/roster`,
    },
    {
      id: "page:settings",
      type: "page",
      title: "Settings",
      href: `${base}/settings`,
    },
  ];
}

export function filterPageResults(
  pages: SearchResult[],
  query: string,
): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return pages.filter((page) => page.title.toLowerCase().includes(needle));
}
