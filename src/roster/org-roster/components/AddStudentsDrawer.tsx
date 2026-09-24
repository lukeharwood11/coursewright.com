import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function AddStudentsDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Close add students"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)] md:max-w-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line-soft)] px-5 py-4 md:px-6">
          <div>
            <h2 id={titleId} className="text-[17px] font-extrabold text-[var(--ink)]">
              Add students
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              Name is enough. Email and grade details are optional.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            aria-label="Close add students"
            onClick={onClose}
          >
            <XMarkIcon className="size-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}
