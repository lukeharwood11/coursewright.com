import { toast } from "sonner";
import { isNetworkError } from "./networkError";

/** Placeholder for actions whose screens are not built yet. */
export function toastNotImplemented(action: string) {
  toast(`${action} isn’t ready yet.`);
}

export function toastSomethingWentWrong() {
  toast("Something went wrong.");
}

export function toastCheckNetworkConnection() {
  toast("Check your network connection and try again.");
}

/** Toast a caught failure with a network-specific message when appropriate. */
export function toastCaughtError(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (isNetworkError(error)) {
    toastCheckNetworkConnection();
    return;
  }
  const message =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";
  toast(message || fallback);
}

/**
 * Route a caught mutation/query failure: toast for network errors (returns null),
 * otherwise return a message suitable for form state or a specific toast.
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
