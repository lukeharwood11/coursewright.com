import { Button, ButtonLink } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";
import { BrokenIcon } from "./components/BrokenIcon";
import { useReportAppError } from "./hooks/useReportAppError";

type ErrorPageProps = {
  error: Error;
  componentStack?: string | null;
  onRetry?: () => void;
};

/**
 * Catch-all failure screen: brand wordmark, broken mark, and reassurance that
 * we were notified. Rendered by the app error boundary.
 */
export function ErrorPage({
  error,
  componentStack = null,
  onRetry,
}: ErrorPageProps) {
  useReportAppError(error, { componentStack });

  function handleRetry() {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.assign("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-5 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <Wordmark to="/" size="login" />

        <span
          className="mt-8 inline-flex h-12 w-12 items-center justify-center rounded-[10px] bg-[var(--amber-tint)] text-[var(--amber-deep)]"
          aria-hidden
        >
          <BrokenIcon className="h-7 w-7" />
        </span>

        <h1
          className="mt-5 text-[28px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Something went wrong
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          We’ve been notified and will look into it. You can try again, or head
          back home while we sort this out.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={handleRetry} className="sm:min-w-[140px]">
            Try again
          </Button>
          <ButtonLink to="/" variant="secondary" className="sm:min-w-[140px]">
            Go home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
