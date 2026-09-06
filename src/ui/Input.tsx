import type { InputHTMLAttributes } from "react";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={[
        "rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
        "placeholder:text-[var(--ink-faint)]",
        "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
        "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
        className ?? "",
      ].join(" ")}
    />
  );
}
