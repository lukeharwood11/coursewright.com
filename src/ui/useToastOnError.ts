import { useEffect } from "react";
import { toastSomethingWentWrong } from "./toast";

/** Show a generic toast when a query or mutation error appears. */
export function useToastOnError(error: string | null | undefined) {
  useEffect(() => {
    if (error) toastSomethingWentWrong();
  }, [error]);
}
