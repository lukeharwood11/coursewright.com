import {
  PARENT_VIEW_LABEL,
  TEACHER_VIEW_LABEL,
  type StaffViewMode,
} from "../model/viewMode";

export function StaffViewToggle({
  mode,
  onChange,
}: {
  mode: StaffViewMode;
  onChange: (mode: StaffViewMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="How you see this organization"
      className="inline-flex shrink-0 rounded-[6px] border border-[var(--line)] bg-[var(--paper)] p-0.5"
    >
      <ViewOption
        selected={mode === "teacher"}
        onSelect={() => onChange("teacher")}
      >
        {TEACHER_VIEW_LABEL}
      </ViewOption>
      <ViewOption
        selected={mode === "parent"}
        onSelect={() => onChange("parent")}
      >
        {PARENT_VIEW_LABEL}
      </ViewOption>
    </div>
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
