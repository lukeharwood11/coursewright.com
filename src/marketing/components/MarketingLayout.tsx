import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";
import { footerLinkForPath } from "../model/footerNav";
import { helpDocTitle } from "../model/helpDocs";

export function MarketingLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/") {
      document.title = "Course Wright";
      return;
    }
    const docsTitle = helpDocTitle(pathname);
    if (docsTitle) {
      document.title = `${docsTitle} · Course Wright`;
      return;
    }
    const link = footerLinkForPath(pathname);
    document.title = link ? `${link.label} · Course Wright` : "Course Wright";
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <MarketingHeader />
      <Outlet />
      <MarketingFooter />
    </div>
  );
}
