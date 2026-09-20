import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  /** Extra classes on the outer wrapper (e.g. `w-full`). */
  wrapperClassName?: string;
  size?: "default" | "compact";
};

export function Select({
  className,
  wrapperClassName,
  disabled,
  size = "default",
  ...rest
}: SelectProps) {
  const sizing =
    size === "compact"
      ? "py-2 pl-3 pr-9 text-[13px] font-bold leading-normal"
      : "py-[11px] pl-[13px] pr-10 text-[14.5px] leading-normal";

  return (
    <div
      className={["relative inline-block min-w-0 align-middle", wrapperClassName]
        .filter(Boolean)
        .join(" ")}
    >
      <select
        {...rest}
        disabled={disabled}
        className={[
          "w-full appearance-none rounded-[6px] border border-[var(--line)] bg-[var(--surface)]",
          sizing,
          "text-[var(--ink)] outline-none",
          "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
          "disabled:cursor-not-allowed disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
          className ?? "",
        ].join(" ")}
      />
      <ChevronDownIcon
        aria-hidden
        className={[
          "pointer-events-none absolute top-1/2 -translate-y-1/2",
          size === "compact" ? "right-2.5 size-3.5" : "right-3 size-4",
          disabled ? "text-[var(--ink-faint)]" : "text-[var(--ink-soft)]",
        ].join(" ")}
      />
    </div>
  );
}
