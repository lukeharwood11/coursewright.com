import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  searchCourses,
  searchMaterials,
  searchQueryKeys,
} from "@/search/databridge/search";
import { filterPageResults, staffSearchPages } from "@/search/model/pages";
import {
  isSearchableQuery,
  normalizeSearchQuery,
} from "@/search/model/query";
import {
  mergeSearchResults,
  rankSearchResults,
  type SearchResult,
} from "@/search/model/results";

const DEBOUNCE_MS = 200;

export function useOrgSearch(args: {
  organizationId: number;
  orgSlug: string;
  enabled: boolean;
}) {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(normalizeSearchQuery(rawQuery));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [rawQuery]);

  const trimmed = normalizeSearchQuery(rawQuery);
  const pendingDebounce = trimmed !== debouncedQuery;
  const searchable = args.enabled && isSearchableQuery(debouncedQuery);

  const searchQuery = useQuery({
    queryKey: searchQueryKeys.org(args.organizationId, debouncedQuery),
    queryFn: async (): Promise<SearchResult[]> => {
      const query = debouncedQuery;
      const ftsArgs = {
        organizationId: args.organizationId,
        orgSlug: args.orgSlug,
        query,
      };
      const [courses, materials] = await Promise.all([
        searchCourses(ftsArgs),
        searchMaterials(ftsArgs),
      ]);
      const pages = filterPageResults(staffSearchPages(args.orgSlug), query);
      return rankSearchResults(mergeSearchResults([pages, courses, materials]), query);
    },
    enabled: searchable,
  });

  const results =
    !pendingDebounce && searchable ? (searchQuery.data ?? []) : [];
  const showPanel = open && trimmed.length > 0;

  return {
    query: rawQuery,
    setQuery: setRawQuery,
    open: showPanel,
    setOpen,
    results,
    loading:
      pendingDebounce || (searchable && searchQuery.isFetching),
    error:
      !pendingDebounce && searchQuery.error
        ? searchQuery.error.message
        : null,
    clear: () => {
      setRawQuery("");
      setDebouncedQuery("");
      setOpen(false);
    },
  };
}
