import { useId, useRef, useState, type ReactNode } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { AnchoredPopup } from "@/ui/AnchoredPopup";

export function InfoHint({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <span className="inline-flex">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex rounded-full text-[var(--ink-faint)] hover:text-[var(--ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
      >
        <InformationCircleIcon className="h-4 w-4" aria-hidden />
      </button>
      <AnchoredPopup
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
        id={tooltipId}
        role="tooltip"
        preferredAlign="start"
        className="w-[16rem] px-3 py-2 text-[12.5px] font-medium leading-snug text-[var(--ink-soft)]"
      >
        {children}
      </AnchoredPopup>
    </span>
  );
}
