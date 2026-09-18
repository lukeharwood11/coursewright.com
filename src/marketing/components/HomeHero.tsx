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
          className="mt-3 text-[26px] font-semibold leading-snug text-[var(--ink)] sm:text-[30px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Plan wright. Share wright. Course Wright.
        </h1>
        <p className="mt-2 text-[15px] font-extrabold text-[var(--green)]">Courses, done wright.</p>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
          One place for homeschool co-ops and micro-schools to plan courses, share
          materials with parents, and print what you need — without the clunky
          complexity of typical school software.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/signup">Sign up</ButtonLink>
          <ButtonLink to="/about" variant="secondary">
            See how it works
            <ArrowRightIcon className="h-5 w-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
      <ParentPreviewCard />
    </section>
  );
}
