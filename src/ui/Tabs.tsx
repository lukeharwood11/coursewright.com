import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

const segmentIdle =
  "inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-60";

const segmentActive =
  "inline-flex items-center justify-center gap-1.5 bg-[var(--green-tint)] px-3 py-2 text-[13px] font-bold text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

const segmentShell =
  "inline-flex overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)] [&>*+*]:border-l [&>*+*]:border-[var(--line)]";

export function segmentButtonClass(active: boolean, extra?: string) {
  return [active ? segmentActive : segmentIdle, extra ?? ""]
    .filter(Boolean)
    .join(" ");
}

/** Bordered segmented shell — tabs, or a single control like Resources “New”. */
export function SegmentGroup({
  children,
  className,
  label,
  role = "group",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  role?: "group" | "tablist";
}) {
  return (
    <div
      role={role}
      aria-label={label}
      className={[segmentShell, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}

export function TabList({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SegmentGroup role="tablist" label={label} className={className}>
      {children}
    </SegmentGroup>
  );
}

export function Tab({
  selected,
  onSelect,
  children,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={segmentButtonClass(selected, className)}
    >
      {children}
    </button>
  );
}

/** Segmented pressed button (filters) — same look as Tab, without tab roles. */
export const SegmentButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }
>(function SegmentButton({ pressed = false, className, type = "button", ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={segmentButtonClass(pressed, className)}
      {...rest}
    />
  );
});
