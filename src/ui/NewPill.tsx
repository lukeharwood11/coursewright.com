/** Compact “new feature” marker — use sparingly on recently shipped surfaces. */
export function NewPill({ className }: { className?: string }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full bg-[var(--slate-tint)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--slate)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      New
    </span>
  );
}
