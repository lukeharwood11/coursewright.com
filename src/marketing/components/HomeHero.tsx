import { ArrowDownIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { ParentPreviewCard } from "./ParentPreviewCard";

export function HomeHero() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-14 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[var(--green)]">
          For families, co-ops, and small schools
        </p>
        <h1
          className="mt-2 text-[38px] font-semibold leading-[1.15] text-[var(--green)] sm:text-[48px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Courses, done wright.
        </h1>
        <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[var(--ink-soft)] sm:text-[17px]">
          Plan courses, organize materials, and keep each week clear — on screen
          or on paper. Simple enough for a family, flexible enough for a small
          school.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/signup">Start free</ButtonLink>
          <ButtonLink to="#how-it-works" variant="secondary">
            See how it works
            <ArrowDownIcon className="h-5 w-5" aria-hidden />
          </ButtonLink>
        </div>
        <p className="mt-3 text-[12.5px] text-[var(--ink-faint)]">
          Free for up to two students. No credit card.
        </p>
      </div>
      <ParentPreviewCard />
    </section>
  );
}
