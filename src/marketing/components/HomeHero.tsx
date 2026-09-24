import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { Wordmark } from "@/ui/Wordmark";
import { ParentPreviewCard } from "./ParentPreviewCard";

export function HomeHero() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-12 sm:py-16 lg:grid-cols-2">
      <div>
        <Wordmark size="hero" />
        <h1
          className="mt-3 text-[26px] font-semibold leading-snug text-[var(--green)] sm:text-[32px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          This week’s materials. Printed. Without another portal.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Course Wright is the course hub for homeschool co-ops and micro-schools.
          Plan the course, enroll families, and print what parents need this week —
          built for volunteer-run groups and tech-averse parents, not district
          software.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/signup">Start free</ButtonLink>
          <ButtonLink to="#this-week" variant="secondary">
            See how This week works
            <ArrowRightIcon className="h-5 w-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
      <figure>
        <ParentPreviewCard />
        <figcaption className="mt-2 text-center text-[12.5px] text-[var(--ink-faint)]">
          What a linked parent sees.
        </figcaption>
      </figure>
    </section>
  );
}
