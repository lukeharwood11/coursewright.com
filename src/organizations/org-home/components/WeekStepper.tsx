import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const segmentIdle =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none";

const navGroupClass =
  "inline-grid grid-cols-2 overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]";

export function WeekStepper({
  onPrev,
  onNext,
  onThisWeek,
  showThisWeek,
}: {
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
  showThisWeek: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={navGroupClass} role="group" aria-label="Move to previous or next week">
        <button
          type="button"
          className={`${segmentIdle} justify-center border-r border-[var(--line)]`}
          onClick={onPrev}
          aria-label="Previous week"
        >
          <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
          Previous week
        </button>
        <button
          type="button"
          className={`${segmentIdle} justify-center`}
          onClick={onNext}
          aria-label="Next week"
        >
          Next week
          <ChevronRightIcon className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
      {showThisWeek ? (
        <button
          type="button"
          className={`${segmentIdle} rounded-[6px] border border-[var(--line)]`}
          onClick={onThisWeek}
        >
          This week
        </button>
      ) : null}
    </div>
  );
}
