import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";
import { applyNoIndexDocumentMeta, applyPublicDocumentMeta } from "../model/documentMeta";
import { publicSeoPageForPath } from "../model/publicSeo";

export function MarketingLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/logos") {
      applyNoIndexDocumentMeta("Logos · Course Wright");
      return;
    }
    applyPublicDocumentMeta(publicSeoPageForPath(pathname));
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <MarketingHeader />
      <Outlet />
      <MarketingFooter />
    </div>
  );
}
