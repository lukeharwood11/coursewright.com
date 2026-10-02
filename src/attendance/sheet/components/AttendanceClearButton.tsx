export function AttendanceClearButton({
  disabled,
  onClear,
}: {
  disabled?: boolean;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClear}
      className={[
        "rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[12px] font-bold text-[var(--ink)]",
        "hover:border-[var(--green)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
      ].join(" ")}
    >
      Clear
    </button>
  );
}
