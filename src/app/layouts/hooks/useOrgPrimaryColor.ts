import { useEffect } from "react";
import { primaryColorVars } from "@/organizations/model/brand";

const PRIMARY_KEYS = ["--green", "--green-deep", "--green-tint"] as const;

/**
 * Sets the org accent as the primary color on the document so portaled
 * dialogs and popups match in-page buttons. Cleared when the org unmounts.
 */
export function useOrgPrimaryColor(accentColor: string | null | undefined) {
  useEffect(() => {
    const vars = primaryColorVars(accentColor);
    if (!vars) return;
    const root = document.documentElement;
    for (const key of PRIMARY_KEYS) {
      root.style.setProperty(key, vars[key]);
    }
    return () => {
      for (const key of PRIMARY_KEYS) {
        root.style.removeProperty(key);
      }
    };
  }, [accentColor]);
}
