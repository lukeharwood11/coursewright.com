import {
  availableStaffViewModes,
  parseStaffViewMode,
  type StaffViewMode,
  type StaffViewModeOption,
} from "../model/viewMode";
import { Select } from "@/ui/Select";

export function StaffViewToggle({
  mode,
  onChange,
  isParent,
  isStudent,
}: {
  mode: StaffViewMode;
  onChange: (mode: StaffViewMode) => void;
  isParent: boolean;
  isStudent: boolean;
}) {
  const options = availableStaffViewModes({ isParent, isStudent });
  const useMobileSelect = options.length >= 3;

  return (
    <>
      {useMobileSelect ? (
        <div className="md:hidden">
          <Select
            size="compact"
            wrapperClassName="min-w-[7.5rem]"
            value={mode}
            aria-label="How you see this organization"
            onChange={(event) => {
              const next = parseStaffViewMode(event.target.value);
              if (options.some((option) => option.mode === next)) {
                onChange(next);
              }
            }}
          >
            {options.map((option) => (
              <option key={option.mode} value={option.mode}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <div
        role="radiogroup"
        aria-label="How you see this organization"
        className={[
          "inline-flex shrink-0 rounded-[6px] border border-[var(--line)] bg-[var(--paper)] p-0.5",
          useMobileSelect ? "hidden md:inline-flex" : "",
        ].join(" ")}
      >
        {options.map((option) => (
          <ViewOption
            key={option.mode}
            selected={mode === option.mode}
            onSelect={() => onChange(option.mode)}
          >
            {option.label}
          </ViewOption>
        ))}
      </div>
    </>
  );
}

function ViewOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "rounded-[4px] px-2.5 py-1 text-[12px] font-bold md:text-[12.5px]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chrome-accent)]",
        "motion-reduce:transition-none",
        selected
          ? "bg-[var(--chrome-accent)] text-white"
          : "text-[var(--ink-soft)] hover:bg-[var(--chrome-accent-tint)] hover:text-[var(--chrome-accent-deep)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export type { StaffViewModeOption };
