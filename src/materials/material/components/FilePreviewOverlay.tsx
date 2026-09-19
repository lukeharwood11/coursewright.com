import { useEffect, useId, useRef, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

/** Full-viewport preview frame for PDFs (and similar). */
export function FilePreviewOverlay({
  open,
  title,
  onClose,
  actions,
  children,
}: Props) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-soft)] px-4 py-3">
          <p
            id={titleId}
            className="min-w-0 truncate text-[14px] font-bold text-[var(--ink)]"
          >
            {title}
          </p>
          <div className="flex flex-wrap gap-2">
            {actions}
            <Button type="button" variant="secondary" onClick={onClose}>
              <XMarkIcon className="h-5 w-5" aria-hidden />
              Close
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-[var(--paper)]">{children}</div>
      </div>
    </div>
  );
}
