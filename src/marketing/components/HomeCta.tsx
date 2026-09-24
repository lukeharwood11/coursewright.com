import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";

export function HomeCta() {
  return (
    <section className="bg-[var(--green-tint)]">
      <div className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h2
          className="text-[28px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Start with one course and two students — for free.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
          When you are ready to add more students, collaborators, or a whole small
          school, compare plans and contact us. We are onboarding larger programs
          directly.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/signup">Start free</ButtonLink>
          <ButtonLink to="/pricing" variant="secondary">
            See pricing
            <ArrowRightIcon className="h-5 w-5" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
