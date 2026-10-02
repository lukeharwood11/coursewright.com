export function AttendanceUndoNotice({
  message,
  disabled,
  onUndo,
}: {
  message: string;
  disabled?: boolean;
  onUndo: () => void;
}) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[var(--ink)]" role="status">
      <span>{message}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onUndo}
        className="font-bold text-[var(--green)] hover:text-[var(--green-deep)] disabled:opacity-60"
      >
        Undo
      </button>
    </p>
  );
}
