import { useEffect, useRef } from "react";
import {
  initPostHog,
  isPostHogConfigured,
  posthog,
} from "@/infrastructure/posthog/client";

export type ReportAppErrorOptions = {
  componentStack?: string | null;
};

/**
 * Sends a one-shot exception to PostHog when an error page is shown.
 * No-ops when PostHog is not configured (local without keys).
 */
export function useReportAppError(
  error: Error | null,
  options: ReportAppErrorOptions = {},
) {
  const reportedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!error || !isPostHogConfigured) return;

    const key = `${error.message}:${options.componentStack ?? ""}`;
    if (reportedKey.current === key) return;
    reportedKey.current = key;

    initPostHog();
    posthog.captureException(error, {
      source: "error_boundary",
      component_stack: options.componentStack ?? undefined,
    });
  }, [error, options.componentStack]);
}
