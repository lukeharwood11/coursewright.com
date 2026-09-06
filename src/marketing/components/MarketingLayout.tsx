import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";
import { footerLinkForPath } from "../model/footerNav";

export function MarketingLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const link = footerLinkForPath(pathname);
    if (pathname === "/") {
      document.title = "Course Wright";
      return;
    }
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
