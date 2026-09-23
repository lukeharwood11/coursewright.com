import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { APP_SHELL_MAIN_ID } from "@/app/layouts/components/AppShellFrame";

/** Start each new pathname at the top of the scrollport (shell main or window). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const shellMain = document.getElementById(APP_SHELL_MAIN_ID);
    if (shellMain) {
      shellMain.scrollTo(0, 0);
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
