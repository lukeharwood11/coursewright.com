import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { BillingIntervalToggle } from "./components/BillingIntervalToggle";
import { PricingPlanCard } from "./components/PricingPlanCard";
import { PricingPlanDetails } from "./components/PricingPlanDetails";
import { usePublicPricing } from "./hooks/usePublicPricing";

export function PricingPage() {
  const { interval, setInterval, plans } = usePublicPricing();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <section className="max-w-3xl">
        <p className="text-[13px] font-bold text-[var(--ink-faint)]">Pricing</p>
        <h1
          className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Family, Microschool, and School
        </h1>
        <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
          Choose the capacity and organization tools you need. Every plan can build
          courses, organize materials, share the week, and print what matters.
        </p>

        <div className="mt-8">
          <BillingIntervalToggle interval={interval} onChange={setInterval} />
        </div>
      </section>

      <ul
        className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-live="polite"
      >
        {plans.map((plan) => (
          <li key={plan.id} className="h-full">
            <PricingPlanCard plan={plan} />
          </li>
        ))}
      </ul>

      <PricingPlanDetails plans={plans} />

      <nav aria-label="Pricing links" className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/" variant="secondary">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Back to home
        </ButtonLink>
        <ButtonLink to="/contact" variant="secondary">
          Contact page
        </ButtonLink>
      </nav>
    </main>
  );
}
