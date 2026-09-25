import { toast } from "sonner";
import {
  initPostHog,
  isPostHogConfigured,
  posthog,
} from "@/infrastructure/posthog/client";
import { isNetworkError } from "./networkError";

export const GENERIC_ERROR_TOAST_MESSAGE =
  "Something went wrong, please try again later.";

function normalizeCaughtError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") {
    const message = error.trim();
    if (message) return new Error(message);
  }
  return new Error("Unknown error");
}

/** Log and report a caught failure (console + PostHog when configured). */
export function reportCaughtError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const err = normalizeCaughtError(error);
  console.error(err, context ?? "");
  if (!isPostHogConfigured) return;
  initPostHog();
  posthog.captureException(err, {
    source: "toast",
    ...context,
  });
}

function toastGenericError() {
  toast.error(GENERIC_ERROR_TOAST_MESSAGE);
}

/** Placeholder for actions whose screens are not built yet. */
export function toastNotImplemented(action: string) {
  toast(`${action} isn’t ready yet.`);
}

export function toastSomethingWentWrong() {
  toastGenericError();
}

export function toastCheckNetworkConnection() {
  toast("Check your network connection and try again.");
}

/** Toast a caught failure with a network-specific message when appropriate. */
export function toastCaughtError(error: unknown) {
  if (isNetworkError(error)) {
    toastCheckNetworkConnection();
    return;
  }
  reportCaughtError(error);
  toastGenericError();
}

/**
 * Route a caught mutation/query failure: toast for network errors (returns null),
 * otherwise return a message suitable for form state (not for toasts).
 */
export function caughtErrorMessage(error: unknown): string | null {
  if (isNetworkError(error)) {
    toastCheckNetworkConnection();
    return null;
  }
  if (error instanceof Error) {
    const message = error.message.trim();
    return message || "Something went wrong.";
  }
  if (typeof error === "string") {
    const message = error.trim();
    return message || "Something went wrong.";
  }
  return "Something went wrong.";
}

/** Prefer local form copy; omit network failures (toast those separately). */
export function formOrMutationError(
  formError: string | null | undefined,
  mutationError: Error | null | undefined,
): string | null {
  if (formError) return isNetworkError(formError) ? null : formError;
  if (!mutationError) return null;
  return isNetworkError(mutationError) ? null : mutationError.message;
}
