import type { ComponentType, SVGProps } from "react";
import { SegmentButton, SegmentGroup, segmentButtonClass } from "@/ui/Tabs";

export type ResponsiveSegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Tighter segments on small screens — full row of tabs at all breakpoints. */
const compactSegmentButtonClass = [
  "min-w-0 flex-1 flex-col gap-0 px-0.5 py-1 text-[8.5px] font-bold leading-none tracking-tight",
  "min-[361px]:gap-0.5 min-[361px]:px-1 min-[361px]:py-1.5 min-[361px]:text-[9.5px]",
  "sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-[13px] sm:leading-normal sm:tracking-normal",
].join(" ");

const compactSegmentIconClass =
  "size-2.5 shrink-0 min-[361px]:size-3 sm:size-4";

export function ResponsiveSegmentPicker<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  disabled = false,
  className,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: ResponsiveSegmentOption<T>[];
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SegmentGroup
      label={ariaLabel}
      className={[
        "mt-2 flex w-full [&>button]:min-w-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => (
        <SegmentButton
          key={optionValue}
          pressed={value === optionValue}
          disabled={disabled}
          className={segmentButtonClass(
            value === optionValue,
            compactSegmentButtonClass,
          )}
          onClick={() => onChange(optionValue)}
        >
          {Icon ? <Icon className={compactSegmentIconClass} aria-hidden /> : null}
          <span className="whitespace-normal text-center leading-none min-[361px]:leading-tight sm:leading-normal">
            {label}
          </span>
        </SegmentButton>
      ))}
    </SegmentGroup>
  );
}
