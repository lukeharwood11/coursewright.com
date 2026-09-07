import type { ReactNode } from "react";

type Variant = "green" | "amber" | "amberSolid" | "slate" | "neutral";

const variantClass: Record<Variant, string> = {
  green: "bg-[var(--green-tint)] text-[var(--green-deep)]",
  amber: "bg-[var(--amber-tint)] text-[var(--amber-deep)]",
  amberSolid: "bg-[var(--amber)] text-white",
  slate: "bg-[var(--slate-tint)] text-[var(--slate)]",
  neutral: "bg-[var(--line-soft)] text-[var(--ink-soft)]",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-bold ${variantClass[variant]}`}
    >
      {children}
    </span>
  );
}
