import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Start each new pathname at the top of the page. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
