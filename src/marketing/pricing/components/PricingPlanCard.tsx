import { contactEmails, mailto } from "../../model/contactEmails";
import type { PricedPlan } from "../hooks/usePublicPricing";

const contactClass = [
  "inline-flex min-h-11 w-full items-center justify-center rounded-[6px] border px-3 py-2 text-center text-[13px] font-bold leading-none transition-colors",
  "border-[var(--green)] bg-[var(--green)] text-white hover:border-[var(--green-deep)] hover:bg-[var(--green-deep)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "motion-reduce:transition-none",
].join(" ");

const detailsClass = [
  "inline-flex min-h-11 w-full items-center justify-center rounded-[6px] border px-3 py-2 text-center text-[13px] font-bold leading-none transition-colors",
  "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "motion-reduce:transition-none",
].join(" ");

export function PricingPlanCard({ plan }: { plan: PricedPlan }) {
  const isFree = plan.monthlyUsd == null && plan.yearlyUsd == null;

  return (
    <article className="flex h-full flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <header>
        <h2 className="text-[16px] font-extrabold text-[var(--ink)]">{plan.name}</h2>
        <div className="mt-4 flex min-h-10 items-end gap-2">
          <p
            className="text-[36px] font-semibold leading-none text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {plan.priceLabel}
          </p>
          {plan.periodLabel ? (
            <p className="pb-0.5 text-[13px] font-bold text-[var(--ink-faint)]">
              {plan.periodLabel}
            </p>
          ) : null}
        </div>
        <div className="mt-2 min-h-5">
          {plan.yearlyTotalLabel ? (
            <p className="text-[13px] font-bold text-[var(--ink-soft)]">
              {plan.yearlyTotalLabel}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-1 min-h-[4.25rem]">
        {plan.freeNote ? (
          <p className="inline-flex rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[12.5px] font-extrabold text-[var(--green-deep)]">
            {plan.freeNote}
          </p>
        ) : null}
        {plan.savingsText ? (
          <p className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
            <span className="inline-flex rounded-full bg-[var(--green-tint)] px-2.5 py-1 font-extrabold text-[var(--green-deep)]">
              {plan.savingsText}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="flex flex-col gap-2.5 border-t border-[var(--line-soft)] pt-4 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        {plan.caps.map((line) => (
          <li key={line} className="flex gap-2.5">
            <span
              className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]"
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {plan.highlights.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2.5 border-t border-[var(--line-soft)] pt-4 text-[14px] leading-relaxed text-[var(--ink)]">
          {plan.highlights.map((line) => (
            <li key={line} className="flex gap-2.5">
              <span
                className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={`mt-auto grid gap-2 pt-6 ${isFree ? "grid-cols-1" : "grid-cols-2"}`}
      >
        <a
          href={`#${plan.id}-details`}
          className={detailsClass}
          aria-label={`View ${plan.name} plan details`}
        >
          Details
        </a>
        {isFree ? null : (
          <a href={mailto(contactEmails.hi)} className={contactClass}>
            Contact us
          </a>
        )}
      </div>
    </article>
  );
}
