import { useState } from "react";
import { Input } from "@/ui/Input";

/**
 * Assignment date with optional due date. “Add due date” sits next to the
 * assignment label; when opened, due date + time stack below.
 */
export function MaterialDateFields({
  scheduledDate,
  dueDate,
  dueTime,
  timeZoneLabel,
  onScheduledChange,
  onDueDateChange,
  onDueTimeChange,
}: {
  scheduledDate: string;
  dueDate: string;
  dueTime: string;
  timeZoneLabel: string;
  onScheduledChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onDueTimeChange: (value: string) => void;
}) {
  const [showDue, setShowDue] = useState(false);
  const dueOpen = dueDate !== "" || showDue;

  return (
    <div className="mt-3 flex flex-col gap-3">
      <label className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Assignment date (optional)
          </span>
          {!dueOpen ? (
            <button
              type="button"
              className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              onClick={() => setShowDue(true)}
            >
              Add due date
            </button>
          ) : null}
        </span>
        <Input
          className="w-full"
          type="date"
          value={scheduledDate}
          onChange={(event) => onScheduledChange(event.target.value)}
        />
        {!dueOpen ? (
          <span className="text-[12px] text-[var(--ink-faint)]">
            If you set a date, this shows up on This week for students that week.
          </span>
        ) : null}
      </label>

      {dueOpen ? (
        <label className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Due date</span>
            <button
              type="button"
              className="text-[12px] font-bold text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
              onClick={() => {
                onDueDateChange("");
                setShowDue(false);
              }}
            >
              Remove
            </button>
          </span>
          <span className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <Input
              className="w-full"
              type="date"
              value={dueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
            />
            <Input
              className="w-full sm:max-w-[9rem]"
              type="time"
              value={dueTime}
              onChange={(event) => onDueTimeChange(event.target.value)}
            />
          </span>
          <span className="text-[12px] text-[var(--ink-faint)]">
            Optional. Separate from the assignment date used for This week. Times
            use {timeZoneLabel}.
          </span>
        </label>
      ) : null}
    </div>
  );
}
