import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { QuizPrintOptionsModalBody } from "./QuizPrintOptionsPanel";
import type { UnitPrintQuizOption } from "../hooks/useUnitPrintOptions";
import type { QuizKeyPrintMode } from "@/print/model/quizKeyPrintMode";

export function QuizPrintOptionsModal({
  open,
  onClose,
  variant,
  mode,
  onModeChange,
  unitQuizzes,
  onUnitQuizModeChange,
}: {
  open: boolean;
  onClose: () => void;
  variant: "quiz" | "unit";
  mode?: QuizKeyPrintMode;
  onModeChange?: (mode: QuizKeyPrintMode) => void;
  unitQuizzes?: UnitPrintQuizOption[];
  onUnitQuizModeChange?: (quizId: number, mode: QuizKeyPrintMode) => void;
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
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
        <h2 id={titleId} className="text-[16px] font-bold text-[var(--ink)]">
          Print options
        </h2>
        <Button
          ref={closeRef}
          type="button"
          variant="secondary"
          className="px-2.5 py-2"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <QuizPrintOptionsModalBody
          variant={variant}
          mode={mode}
          onModeChange={onModeChange}
          unitQuizzes={unitQuizzes}
          onUnitQuizModeChange={onUnitQuizModeChange}
        />
      </div>
    </div>,
    document.body,
  );
}
