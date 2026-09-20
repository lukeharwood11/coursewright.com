import { Mark } from "./Wordmark";

type PageLoadingProps = {
  /** What’s loading — shown under the mark. */
  label?: string;
  /** Full-viewport centered state (auth / org shell). */
  fullScreen?: boolean;
  /** Sit under an existing page header (skip outer page padding). */
  embedded?: boolean;
  className?: string;
};

export function PageLoading({
  label = "Loading…",
  fullScreen = false,
  embedded = false,
  className = "",
}: PageLoadingProps) {
  const shell = fullScreen
    ? "flex min-h-screen items-center justify-center bg-[var(--paper)] px-4"
    : embedded
      ? "py-10"
      : "px-5 py-16 md:px-8";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={[shell, className].filter(Boolean).join(" ")}
    >
      <div className="flex flex-col items-center text-center">
        <span className="cw-loading-mark inline-flex">
          <Mark px={fullScreen ? 56 : 48} />
        </span>
        <p className="mt-4 text-[14px] text-[var(--ink-soft)]">{label}</p>
      </div>
    </div>
  );
}
