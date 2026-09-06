import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { IconWell } from "../components/IconWell";
import { footerColumns, footerLinkForPath } from "../model/footerNav";

export function ConstructionPage() {
  const { pathname } = useLocation();
  const current = footerLinkForPath(pathname);
  const heading = current?.label ?? "This page";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <IconWell>
        <WrenchScrewdriverIcon className="h-5 w-5" aria-hidden />
      </IconWell>
      <p className="mt-4 text-[13px] font-bold text-[var(--ink-faint)]">In construction</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {heading} isn’t ready yet
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        We’re still writing this page. We won’t put placeholder legal or contact copy
        here. Check back, or use one of the pages that already exists.
      </p>

      <h2
        className="mt-10 text-[22px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Site pages
      </h2>
      <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
        These are the links in the site footer.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {footerColumns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="text-[12.5px] font-bold text-[var(--ink-faint)]">{column.heading}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {column.links.map((item) => {
                const isCurrent = item.to === pathname;
                return (
                  <li key={item.to}>
                    {isCurrent ? (
                      <span className="text-[13px] font-bold text-[var(--green)]">{item.label}</span>
                    ) : (
                      <Link
                        to={item.to}
                        className="text-[13px] font-bold text-[var(--ink-soft)] hover:text-[var(--green)]"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>
    </main>
  );
}
