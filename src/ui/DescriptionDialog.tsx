import { useEffect, useId, useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";

const textareaClass = [
  "mt-1 w-full min-h-[6rem] resize-y rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "placeholder:text-[var(--ink-faint)]",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

/** Small dialog for Add / Edit description on editor headers. */
export function DescriptionDialog({
  open,
  value,
  placeholder,
  onClose,
  onSave,
}: {
  open: boolean;
  value: string;
  placeholder: string;
  onClose: () => void;
  onSave: (next: string) => void;
}) {
  const titleId = useId();
  const fieldId = useId();
  const [draft, setDraft] = useState(value);
  const hasDescription = value.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
          onClose();
        }}
      >
        <h2 id={titleId} className="text-[15.5px] font-extrabold text-[var(--ink)]">
          {hasDescription ? "Edit description" : "Add description"}
        </h2>
        <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]" htmlFor={fieldId}>
          Description
          <textarea
            id={fieldId}
            className={textareaClass}
            value={draft}
            autoFocus
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
          <Button type="submit">
            <CheckIcon className="h-4 w-4" aria-hidden />
            Done
          </Button>
        </div>
      </form>
    </div>
  );
}
