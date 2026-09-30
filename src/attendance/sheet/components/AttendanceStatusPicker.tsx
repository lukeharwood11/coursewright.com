import { attendanceStatusLabel } from "@/attendance/model/daySummary";

export function AttendanceStatusPicker<T extends string>({
  label,
  options,
  value,
  disabled,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  disabled?: boolean;
  onChange: (next: T | null) => void;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold text-[var(--ink-soft)]">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = value === option;
          const name = attendanceStatusLabel(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(selected ? null : option)}
              className={[
                "rounded-full border px-2.5 py-1 text-[12px] font-bold",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--green)]",
              ].join(" ")}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
