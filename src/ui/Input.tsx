import type { InputHTMLAttributes } from "react";

const DATE_TYPES = new Set(["date", "datetime-local", "month", "time", "week"]);

export function Input({
  className,
  type,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const dateLike = type != null && DATE_TYPES.has(type);

  return (
    <input
      {...rest}
      type={type}
      className={[
        "rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
        "placeholder:text-[var(--ink-faint)]",
        "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
        "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
        dateLike ? "cw-date-input box-border min-w-0 w-full max-w-full" : "",
        className ?? "",
      ].join(" ")}
    />
  );
}
