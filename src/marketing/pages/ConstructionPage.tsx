import { ArrowLeftIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import { IconWell } from "../components/IconWell";
import { footerLinkForPath } from "../model/footerNav";

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
        here. Check back later, or head home for pages that already exist.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/" variant="secondary">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
