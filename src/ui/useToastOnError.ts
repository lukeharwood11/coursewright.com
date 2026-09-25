import { useEffect } from "react";
import { isNetworkError } from "./networkError";
import {
  reportCaughtError,
  toastCheckNetworkConnection,
  toastSomethingWentWrong,
} from "./toast";

/**
 * Show a toast when a query or mutation error appears.
 * Network failures ask the user to check their connection; other failures use generic copy.
 */
export function useToastOnError(error: string | null | undefined) {
  useEffect(() => {
    if (!error) return;
    if (isNetworkError(error)) toastCheckNetworkConnection();
    else {
      reportCaughtError(error);
      toastSomethingWentWrong();
    }
  }, [error]);
}
