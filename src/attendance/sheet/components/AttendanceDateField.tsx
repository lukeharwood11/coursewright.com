import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { shiftIsoDate } from "@/attendance/model/daySummary";
import { Input } from "@/ui/Input";

const dayNavClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60";

export function AttendanceDateField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const previous = shiftIsoDate(value, -1);
  const next = shiftIsoDate(value, 1);

  return (
    <div>
      <label className="block text-[12px] font-bold text-[var(--ink-soft)]" htmlFor={id}>
        Date
      </label>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          className={dayNavClass}
          aria-label="Previous day"
          disabled={!previous}
          onClick={() => {
            if (previous) onChange(previous);
          }}
        >
          <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Previous day</span>
        </button>
        <div className="w-[11.5rem] min-w-0 shrink">
          <Input
            id={id}
            type="date"
            value={value}
            onChange={(event) => {
              if (event.target.value) onChange(event.target.value);
            }}
          />
        </div>
        <button
          type="button"
          className={dayNavClass}
          aria-label="Next day"
          disabled={!next}
          onClick={() => {
            if (next) onChange(next);
          }}
        >
          <span className="hidden sm:inline">Next day</span>
          <ChevronRightIcon className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}
