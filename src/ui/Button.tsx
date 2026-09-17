import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "google" | "ghost";

const variantClass: Record<Variant, string> = {
  primary:
    "border-[var(--green)] bg-[var(--green)] text-white hover:border-[var(--green-deep)] hover:bg-[var(--green-deep)]",
  secondary:
    "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
  google:
    "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:shadow-[var(--shadow)]",
  ghost:
    "justify-start border-dashed border-[var(--line)] bg-transparent text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
};

function buttonClassName(variant: Variant, fullWidth: boolean | undefined, extra?: string) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-[6px] border px-3 py-[11px] text-[13px] font-bold transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
    "disabled:pointer-events-none disabled:opacity-60",
    "motion-reduce:transition-none",
    fullWidth ? "w-full" : "",
    variantClass[variant],
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    fullWidth?: boolean;
    children: ReactNode;
  }
>(function Button(
  { variant = "primary", fullWidth, children, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={buttonClassName(variant, fullWidth, className)}
    >
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  fullWidth,
  children,
  className,
  to,
}: {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
  to: string;
}) {
  return (
    <Link to={to} className={buttonClassName(variant, fullWidth, className)}>
      {children}
    </Link>
  );
}
