import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import {
  PrintOptionsPanelContent,
  type PrintOptionsPanelProps,
} from "./PrintOptionsPanel";

export function PrintOptionsModal({
  open,
  onClose,
  ...panel
}: PrintOptionsPanelProps & {
  open: boolean;
  onClose: () => void;
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
    <div className="fixed inset-0 z-40 flex items-end md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Close print options"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90dvh,100%)] w-full flex-col rounded-t-[12px] border border-[var(--line-soft)] bg-[var(--paper)] shadow-[var(--shadow)]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line-soft)] px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold text-[var(--ink)]">
              What to print
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
              Pick compact or spaced layout, then download or print.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            aria-label="Close print options"
            onClick={onClose}
          >
            <XMarkIcon className="size-5" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <PrintOptionsPanelContent {...panel} presentation="modal" />
        </div>
        <footer className="shrink-0 border-t border-[var(--line-soft)] px-4 py-3">
          <Button type="button" className="w-full" onClick={onClose}>
            Done
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
