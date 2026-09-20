import {
  CalendarDaysIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import type { CalendarView } from "@/calendar/model/paths";

const segmentIdle =
  "inline-flex items-center gap-1.5 px-3 py-[9px] text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none";

const segmentActive =
  "inline-flex items-center gap-1.5 px-3 py-[9px] text-[13px] font-bold bg-[var(--green-tint)] text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

const groupClass =
  "inline-flex overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]";

export function CalendarToolbar({
  view,
  onPrev,
  onNext,
  onViewChange,
}: {
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onViewChange: (view: CalendarView) => void;
}) {
  const period = view === "day" ? "day" : view === "week" ? "week" : "month";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className={groupClass} role="group" aria-label={`Move to previous or next ${period}`}>
        <button
          type="button"
          className={`${segmentIdle} border-r border-[var(--line)]`}
          onClick={onPrev}
          aria-label={`Previous ${period}`}
        >
          <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
          Previous
        </button>
        <button
          type="button"
          className={segmentIdle}
          onClick={onNext}
          aria-label={`Next ${period}`}
        >
          Next
          <ChevronRightIcon className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>

      <div className={groupClass} role="group" aria-label="Calendar view">
        <button
          type="button"
          aria-pressed={view === "month"}
          className={`${view === "month" ? segmentActive : segmentIdle} border-r border-[var(--line)]`}
          onClick={() => onViewChange("month")}
        >
          <CalendarDaysIcon className="h-4 w-4 shrink-0" aria-hidden />
          Month
        </button>
        <button
          type="button"
          aria-pressed={view === "week"}
          className={`${view === "week" ? segmentActive : segmentIdle} border-r border-[var(--line)]`}
          onClick={() => onViewChange("week")}
        >
          <ViewColumnsIcon className="h-4 w-4 shrink-0" aria-hidden />
          Week
        </button>
        <button
          type="button"
          aria-pressed={view === "day"}
          className={view === "day" ? segmentActive : segmentIdle}
          onClick={() => onViewChange("day")}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden />
          Day
        </button>
      </div>
    </div>
  );
}
