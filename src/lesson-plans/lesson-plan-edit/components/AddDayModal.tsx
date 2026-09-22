import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/ui/Button";
import { weekdayDateLabel } from "@/lesson-plans/model/validate";

export function AddDayModal({
  open,
  dates,
  onSelect,
  onClose,
}: {
  open: boolean;
  dates: string[];
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[20px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add another day
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
          Pick a day from this week that isn’t on the plan yet.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {dates.map((date) => (
            <button
              key={date}
              type="button"
              className={[
                "rounded-[8px] border border-[var(--line)] bg-[var(--paper)] px-4 py-4 text-left text-[15px] font-bold text-[var(--ink)]",
                "transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
                "motion-reduce:transition-none",
              ].join(" ")}
              onClick={() => {
                onSelect(date);
                onClose();
              }}
            >
              {weekdayDateLabel(date)}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button ref={closeRef} type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
