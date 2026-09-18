import { useEffect, useId, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { useOrgSearch } from "@/search/hooks/useOrgSearch";
import { SearchResultCard } from "./SearchResultCard";

type Props = {
  organizationId: number;
  orgSlug: string;
};

export function OrgSearchBar({ organizationId, orgSlug }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    query,
    setQuery,
    open,
    setOpen,
    results,
    loading,
    error,
    clear,
  } = useOrgSearch({
    organizationId,
    orgSlug,
    enabled: true,
  });

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [setOpen]);

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Search
      </label>
      <div className="relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
          aria-hidden
        />
        <Input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search pages, courses, materials…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full py-2 pl-9 pr-3 text-[14px]"
        />
      </div>
      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,24rem)] rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          {loading ? (
            <p className="px-2 py-3 text-[13px] text-[var(--ink-soft)]">
              Searching…
            </p>
          ) : null}
          {!loading && error ? (
            <p className="px-2 py-3 text-[13px] text-[var(--amber-deep)]">
              {error}
            </p>
          ) : null}
          {!loading && !error && results.length === 0 ? (
            <p className="px-2 py-3 text-[13px] text-[var(--ink-soft)]">
              No matches.
            </p>
          ) : null}
          {!loading && !error && results.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {results.map((result) => (
                <li key={result.id} role="option">
                  <SearchResultCard result={result} onSelect={clear} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
