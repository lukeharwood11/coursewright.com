import type { PublicPlan } from "../../model/pricingPlans";

export function PricingPlanDetails({ plans }: { plans: PublicPlan[] }) {
  return (
    <section className="mt-16 border-t border-[var(--line)] pt-12" aria-labelledby="plan-details">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">What is included</p>
      <h2
        id="plan-details"
        className="mt-1 text-[26px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Plan details
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">
        Every plan includes the core course workflow. Higher tiers add capacity,
        collaboration, organization controls, and support.
      </p>

      <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {plans.map((plan) => (
          <article
            key={plan.id}
            id={`${plan.id}-details`}
            className="scroll-mt-6 grid gap-8 py-9 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]"
          >
            <div>
              <h3
                className="text-[22px] font-semibold text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {plan.name}
              </h3>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                {plan.detailIntro}
              </p>

              <h4 className="mt-6 text-[13px] font-extrabold text-[var(--ink)]">
                Plan limits
              </h4>
              <ul className="mt-3 flex flex-wrap gap-2">
                {plan.caps.map((cap) => (
                  <li
                    key={cap}
                    className="rounded-full bg-[var(--green-tint)] px-3 py-1.5 text-[12.5px] font-bold text-[var(--green-deep)]"
                  >
                    {cap}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[13px] font-extrabold text-[var(--ink)]">
                Included features
              </h4>
              <dl className="mt-4 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {plan.features.map((feature) => (
                  <div key={feature.title}>
                    <dt className="text-[14.5px] font-extrabold text-[var(--ink)]">
                      {feature.title}
                    </dt>
                    <dd className="mt-1.5 text-[14px] leading-relaxed text-[var(--ink-soft)]">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
