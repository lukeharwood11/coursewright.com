import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";

export function HomeCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 text-center">
      <h2
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ready to get the course wright?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Create an account, start an organization, and plan from one place. Families
        join when you invite them.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/signup">Sign up</ButtonLink>
        <ButtonLink to="/pricing" variant="secondary">
          See pricing
          <ArrowRightIcon className="h-5 w-5" aria-hidden />
        </ButtonLink>
      </div>
    </section>
  );
}
