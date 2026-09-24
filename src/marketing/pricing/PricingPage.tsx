import { Link } from "react-router-dom";
import { contactEmails, mailto } from "../model/contactEmails";
import { BillingIntervalToggle } from "./components/BillingIntervalToggle";
import { PricingPlanCard } from "./components/PricingPlanCard";
import { usePublicPricing } from "./hooks/usePublicPricing";

export function PricingPage() {
  const { interval, setInterval, plans } = usePublicPricing();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Pricing</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Family, Microschool, and School
      </h1>
      <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        Pick a size for the student profiles you expect. The course hub is the same
        on every plan: build the course, enroll families, and print this week.
      </p>

      <div className="mt-8">
        <BillingIntervalToggle interval={interval} onChange={setInterval} />
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        {plans.map((plan) => (
          <li key={plan.id}>
            <PricingPlanCard plan={plan} />
          </li>
        ))}
      </ul>

      <div className="mt-10 max-w-2xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        <p>
          These prices are shown so you can plan. Billing isn’t live yet, and there
          is no self-serve checkout.{" "}
          <a
            href={mailto(contactEmails.hi)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Contact us
          </a>{" "}
          for a design-partner seat or early access.
        </p>
        <p className="mt-3">
          <Link to="/" className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]">
            Back to home
          </Link>
          <span className="text-[var(--ink-faint)]"> · </span>
          <Link
            to="/contact"
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Contact page
          </Link>
        </p>
      </div>
    </main>
  );
}
