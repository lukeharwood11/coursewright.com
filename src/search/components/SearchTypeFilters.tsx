import {
  SEARCH_TYPE_FILTERS,
  searchTypeFilterLabel,
  type SearchTypeFilter,
} from "@/search/model/results";

type Props = {
  value: SearchTypeFilter;
  onChange: (next: SearchTypeFilter) => void;
};

export function SearchTypeFilters({ value, onChange }: Props) {
  return (
    <div
      role="toolbar"
      aria-label="Result type"
      className="mb-2 flex flex-wrap gap-1"
    >
      {SEARCH_TYPE_FILTERS.map((filter) => {
        const selected = value === filter;
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(filter)}
            className={[
              "rounded-full border px-2 py-0.5 text-[12px] font-bold transition-colors motion-reduce:transition-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
              selected
                ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
            ].join(" ")}
          >
            {searchTypeFilterLabel(filter)}
          </button>
        );
      })}
    </div>
  );
}
