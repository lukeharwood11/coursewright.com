/** Compact “experimental feature” marker — use sparingly on beta surfaces. */
export function BetaPill({ className }: { className?: string }) {
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full bg-[var(--slate-tint)] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[var(--slate)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Beta
    </span>
  );
}
