import { Mark } from "./Wordmark";

/** Blocks the viewport with the animated mark while a save mutation runs. */
export function SavingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--paper)_88%,transparent)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Saving…</span>
      <span className="cw-loading-mark inline-flex" aria-hidden>
        <Mark px={56} />
      </span>
    </div>
  );
}
