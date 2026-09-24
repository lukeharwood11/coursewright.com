import { contactEmails, mailto } from "../../model/contactEmails";
import type { PricedPlan } from "../hooks/usePublicPricing";

const contactClass = [
  "inline-flex w-full items-center justify-center rounded-[6px] border px-3 py-[11px] text-[13px] font-bold transition-colors",
  "border-[var(--green)] bg-[var(--green)] text-white hover:border-[var(--green-deep)] hover:bg-[var(--green-deep)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "motion-reduce:transition-none",
].join(" ");

export function PricingPlanCard({ plan }: { plan: PricedPlan }) {
  return (
    <article className="flex h-full flex-col rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[15px] font-extrabold text-[var(--ink)]">{plan.name}</h2>
      <p
        className="mt-3 text-[32px] font-semibold leading-none text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {plan.priceLabel}
      </p>
      {plan.periodLabel ? (
        <p className="mt-1 text-[13px] font-bold text-[var(--ink-faint)]">{plan.periodLabel}</p>
      ) : null}
      {plan.freeNote ? (
        <p className="mt-2 text-[13px] font-bold text-[var(--green)]">{plan.freeNote}</p>
      ) : null}
      {plan.savingsText ? (
        <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          {plan.savingsCompare ? <span className="block">{plan.savingsCompare}</span> : null}
          <span className="mt-0.5 block font-extrabold text-[var(--green)]">{plan.savingsText}</span>
        </p>
      ) : null}

      <ul className="mt-5 flex flex-col gap-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        {plan.caps.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {plan.highlights.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2 border-t border-[var(--line-soft)] pt-4 text-[14px] leading-relaxed text-[var(--ink)]">
          {plan.highlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <a href={mailto(contactEmails.hi)} className={`mt-auto pt-6 ${contactClass}`}>
        Contact us
      </a>
    </article>
  );
}
