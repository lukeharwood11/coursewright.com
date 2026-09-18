import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  searchCourses,
  searchFiles,
  searchMaterials,
  searchQueryKeys,
  searchUnits,
} from "@/search/databridge/search";
import { filterPageResults, staffSearchPages } from "@/search/model/pages";
import {
  isSearchableQuery,
  normalizeSearchQuery,
} from "@/search/model/query";
import {
  includesSearchType,
  mergeSearchResults,
  rankSearchResults,
  type SearchResult,
  type SearchTypeFilter,
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
  const [typeFilter, setTypeFilter] = useState<SearchTypeFilter>("all");

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
    queryKey: searchQueryKeys.org(
      args.organizationId,
      debouncedQuery,
      typeFilter,
    ),
    queryFn: async (): Promise<SearchResult[]> => {
      const query = debouncedQuery;
      const scopedToType = typeFilter !== "all";
      const ftsArgs = {
        organizationId: args.organizationId,
        orgSlug: args.orgSlug,
        query,
        scopedToType,
      };

      const tasks: Promise<SearchResult[]>[] = [];
      if (includesSearchType(typeFilter, "course")) {
        tasks.push(searchCourses(ftsArgs));
      }
      if (includesSearchType(typeFilter, "unit")) {
        tasks.push(searchUnits(ftsArgs));
      }
      if (includesSearchType(typeFilter, "material")) {
        tasks.push(searchMaterials(ftsArgs));
      }
      if (includesSearchType(typeFilter, "file")) {
        tasks.push(searchFiles(ftsArgs));
      }

      const settled = await Promise.allSettled(tasks);
      const groups: SearchResult[][] = [];
      const failures: string[] = [];
      for (const result of settled) {
        if (result.status === "fulfilled") {
          groups.push(result.value);
          continue;
        }
        failures.push(
          result.reason instanceof Error
            ? result.reason.message
            : "Search couldn’t finish.",
        );
      }
      if (groups.length === 0 && failures.length > 0) {
        throw new Error(failures[0]);
      }

      const pages = includesSearchType(typeFilter, "page")
        ? filterPageResults(staffSearchPages(args.orgSlug), query)
        : [];
      return rankSearchResults(mergeSearchResults([pages, ...groups]), query);
    },
    enabled: searchable,
  });

  const results =
    !pendingDebounce && searchable ? (searchQuery.data ?? []) : [];
  const showPanel = open && trimmed.length > 0;

  return {
    query: rawQuery,
    setQuery: setRawQuery,
    typeFilter,
    setTypeFilter,
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
