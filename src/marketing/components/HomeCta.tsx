import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";

export function HomeCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 text-center">
      <h2
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Start with one course and a handful of families.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Create your organization, invite teachers, enroll students, and print this
        week. Course Wright is free while we work with design partners. Pricing
        comes later — without locking you into school-district software.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/signup">Create your account</ButtonLink>
        <ButtonLink to="/contact" variant="secondary">
          Talk to us about a design-partner seat
          <ArrowRightIcon className="h-5 w-5" aria-hidden />
        </ButtonLink>
      </div>
    </section>
  );
}
