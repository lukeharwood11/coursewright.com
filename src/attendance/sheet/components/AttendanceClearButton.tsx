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
        "text-[13px] font-bold text-[var(--ink-soft)] underline-offset-2 hover:text-[var(--green-deep)] hover:underline",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
      ].join(" ")}
    >
      Clear
    </button>
  );
}
