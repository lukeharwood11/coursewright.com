import { useId, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import { useOrgSearch } from "@/search/hooks/useOrgSearch";
import { SearchResultCard } from "./SearchResultCard";

type Props = {
  organizationId: number;
  orgSlug: string;
};

export function OrgSearchBar({ organizationId, orgSlug }: Props) {
  const listId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
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
  useToastOnError(error);

  return (
    <div className="w-full max-w-md">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Search
      </label>
      <div ref={fieldRef} className="relative">
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
      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={fieldRef}
        id={listId}
        role="listbox"
        preferredAlign="start"
        className="w-[24rem] p-2"
      >
        {loading ? (
          <p className="px-2 py-3 text-[13px] text-[var(--ink-soft)]">
            Searching…
          </p>
        ) : null}
        {!loading && results.length === 0 ? (
          <p className="px-2 py-3 text-[13px] text-[var(--ink-soft)]">
            No matches.
          </p>
        ) : null}
        {!loading && results.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {results.map((result) => (
              <li key={result.id} role="option">
                <SearchResultCard result={result} onSelect={clear} />
              </li>
            ))}
          </ul>
        ) : null}
      </AnchoredPopup>
    </div>
  );
}
