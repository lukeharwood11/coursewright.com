import { Bars3Icon } from "@heroicons/react/24/outline";
import type { PointerEvent } from "react";

export type DragHandleProps = {
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
};

export function DragHandle({
  onPointerDown,
  label = "Drag to reorder",
}: DragHandleProps & { label?: string }) {
  return (
    <button
      type="button"
      className="touch-none shrink-0 cursor-grab px-1.5 text-[var(--ink-faint)] active:cursor-grabbing hover:text-[var(--ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
      onPointerDown={onPointerDown}
      aria-label={label}
    >
      <Bars3Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}
