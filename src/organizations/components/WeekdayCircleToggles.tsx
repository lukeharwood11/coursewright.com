import {
  WEEKDAYS,
  WEEKDAY_LETTERS,
  WEEKDAY_NAMES,
  type SchoolDay,
} from "@/organizations/model/schoolDays";

export function WeekdayCircleToggles({
  selectedDays,
  disabled,
  ariaLabel,
  onToggle,
}: {
  selectedDays: ReadonlySet<SchoolDay>;
  disabled?: boolean;
  ariaLabel: string;
  onToggle: (day: SchoolDay) => void;
}) {
  return (
    <div
      className="grid grid-cols-7 gap-1 sm:gap-2"
      role="group"
      aria-label={ariaLabel}
    >
      {WEEKDAYS.map((day) => {
        const selected = selectedDays.has(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={selected}
            aria-label={WEEKDAY_NAMES[day]}
            disabled={disabled}
            onClick={() => onToggle(day)}
            className={[
              "flex aspect-square w-full max-h-10 items-center justify-center rounded-full border text-[clamp(11px,3.2vw,13px)] font-bold",
              selected
                ? "border-[var(--green)] bg-[var(--green)] text-[var(--surface)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]",
              "focus:outline-none focus:shadow-[0_0_0_3px_var(--green-tint)]",
              "disabled:cursor-not-allowed disabled:opacity-70",
            ].join(" ")}
          >
            {WEEKDAY_LETTERS[day]}
          </button>
        );
      })}
    </div>
  );
}
