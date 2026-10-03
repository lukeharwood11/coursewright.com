import { useEffect, useState } from "react";

const QUERY = "(min-width: 768px)";

/** Matches Tailwind's `md` breakpoint. Used so a tour anchor sits on the visible control. */
export function useMinMd(): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return matches;
}
