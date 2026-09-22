import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/ui/Button";

export function CourseDetailsModal({
  open,
  courseTitle,
  description,
  subject,
  location,
  onClose,
}: {
  open: boolean;
  courseTitle: string;
  description: string;
  subject: string;
  location: string;
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

  const hasAny = Boolean(description.trim() || subject.trim() || location.trim());

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
        className="relative flex max-h-[min(36rem,85vh)] w-full max-w-lg flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
      >
        <h2
          id={titleId}
          className="text-[20px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Course details
        </h2>
        <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">{courseTitle}</p>
        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {!hasAny ? (
            <p className="text-[14px] leading-relaxed text-[var(--ink-soft)]">
              No description, subject, or location has been added for this course yet.
            </p>
          ) : null}
          {description.trim() ? (
            <div>
              <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
                Description
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                {description}
              </p>
            </div>
          ) : null}
          {subject.trim() ? (
            <div>
              <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
                Subject / area
              </h3>
              <p className="mt-1 text-[14.5px] text-[var(--ink-soft)]">{subject}</p>
            </div>
          ) : null}
          {location.trim() ? (
            <div>
              <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
                Location
              </h3>
              <p className="mt-1 text-[14.5px] text-[var(--ink-soft)]">{location}</p>
            </div>
          ) : null}
        </div>
        <div className="mt-5 flex justify-end">
          <Button ref={closeRef} type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
