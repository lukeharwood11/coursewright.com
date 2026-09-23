import { useEffect } from "react";
import { isNetworkError } from "./networkError";
import {
  toastCheckNetworkConnection,
  toastSomethingWentWrong,
} from "./toast";

/**
 * Show a toast when a query or mutation error appears.
 * Network failures ask the user to check their connection; other failures stay generic.
 */
export function useToastOnError(error: string | null | undefined) {
  useEffect(() => {
    if (!error) return;
    if (isNetworkError(error)) toastCheckNetworkConnection();
    else toastSomethingWentWrong();
  }, [error]);
}
