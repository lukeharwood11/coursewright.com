import type { ReactNode } from "react";

type Tone = "green" | "amber" | "slate";

const toneClass: Record<Tone, string> = {
  green: "bg-[var(--green-tint)] text-[var(--green)]",
  amber: "bg-[var(--amber-tint)] text-[var(--amber-deep)]",
  slate: "bg-[var(--slate-tint)] text-[var(--slate)]",
};

/** Small tinted well for a Heroicon. Color inherits via currentColor. */
export function IconWell({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
