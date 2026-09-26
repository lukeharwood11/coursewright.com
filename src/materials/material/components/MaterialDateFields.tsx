import { useState } from "react";
import { materialFocusDayFieldLabel } from "@/materials/model/materialForDateLabel";
import { DEFAULT_HOME_DAYS, type HomeDay } from "@/organizations/model/homeDays";
import {
  DEFAULT_SCHOOL_DAYS,
  type SchoolDay,
} from "@/organizations/model/schoolDays";
import { Input } from "@/ui/Input";

/**
 * Optional due date (primary) and optional focus day (`scheduled_date`) for This week.
 * Focus day label refines to school or home day from the org calendar.
 */
export function MaterialDateFields({
  scheduledDate,
  dueDate,
  dueTime,
  timeZoneLabel,
  schoolDays = DEFAULT_SCHOOL_DAYS,
  homeDays = DEFAULT_HOME_DAYS,
  onScheduledChange,
  onDueDateChange,
  onDueTimeChange,
}: {
  scheduledDate: string;
  dueDate: string;
  dueTime: string;
  timeZoneLabel: string;
  schoolDays?: readonly SchoolDay[];
  homeDays?: readonly HomeDay[];
  onScheduledChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onDueTimeChange: (value: string) => void;
}) {
  const [showForDate, setShowForDate] = useState(false);
  const forOpen = scheduledDate !== "" || showForDate;
  const focusDayLabel = materialFocusDayFieldLabel(
    scheduledDate,
    schoolDays,
    homeDays,
  );

  return (
    <div className="mt-3 flex flex-col gap-3">
      <label className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Due date
          </span>
          {!forOpen ? (
            <button
              type="button"
              className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              onClick={() => setShowForDate(true)}
            >
              Add focus day
            </button>
          ) : null}
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
            disabled={dueDate === ""}
          />
        </span>
        <span className="text-[12px] text-[var(--ink-faint)]">
          {dueDate
            ? `Submission cutoff. Times use ${timeZoneLabel}.`
            : "Leave blank if there is no due date."}
        </span>
      </label>

      {forOpen ? (
        <label className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              {focusDayLabel}
            </span>
            <button
              type="button"
              className="text-[12px] font-bold text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
              onClick={() => {
                onScheduledChange("");
                setShowForDate(false);
              }}
            >
              Remove
            </button>
          </span>
          <Input
            className="w-full"
            type="date"
            value={scheduledDate}
            onChange={(event) => onScheduledChange(event.target.value)}
          />
          <span className="text-[12px] text-[var(--ink-faint)]">
            Shows on This week on this day. Labeled a school or home day from your
            org calendar when it matches.
          </span>
        </label>
      ) : null}
    </div>
  );
}
