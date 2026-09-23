import { useState } from "react";
import { Input } from "@/ui/Input";

/** Optional due date: hidden until “Add due date”, then a date field + remove. */
export function OptionalDueDateField({
  value,
  time,
  timeZoneLabel,
  onChange,
  onTimeChange,
}: {
  value: string;
  time: string;
  timeZoneLabel: string;
  onChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  const [showForced, setShowForced] = useState(false);
  const open = value !== "" || showForced;

  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          onClick={() => setShowForced(true)}
        >
          Add due date
        </button>
      </div>
    );
  }

  return (
    <label className="mt-3 flex min-w-0 flex-col gap-1">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Due date</span>
        <button
          type="button"
          className="text-[12px] font-bold text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          onClick={() => {
            onChange("");
            setShowForced(false);
          }}
        >
          Remove
        </button>
      </span>
      <span className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <Input
          className="w-full"
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input
          className="w-full sm:max-w-[9rem]"
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
        />
      </span>
      <span className="text-[12px] text-[var(--ink-faint)]">
        Optional. Separate from the assignment date used for This week. Times use {timeZoneLabel}.
      </span>
    </label>
  );
}
