import {
  DISCUSSION_FILTERS,
  discussionFilterLabel,
  type DiscussionFilter,
} from "@/discussions/model/audience";

const segmentIdle =
  "inline-flex flex-1 items-center justify-center px-3 py-[9px] text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none";

const segmentActive =
  "inline-flex flex-1 items-center justify-center px-3 py-[9px] text-[13px] font-bold bg-[var(--green-tint)] text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

export function DiscussionFilterChips({
  value,
  onChange,
}: {
  value: DiscussionFilter;
  onChange: (value: DiscussionFilter) => void;
}) {
  return (
    <div
      className="inline-flex max-w-md overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]"
      role="group"
      aria-label="Filter discussions"
    >
      {DISCUSSION_FILTERS.map((filter, index) => {
        const active = value === filter;
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={active}
            className={`${active ? segmentActive : segmentIdle}${
              index < DISCUSSION_FILTERS.length - 1
                ? " border-r border-[var(--line)]"
                : ""
            }`}
            onClick={() => onChange(filter)}
          >
            {discussionFilterLabel(filter)}
          </button>
        );
      })}
    </div>
  );
}
