import { useState } from "react";
import {
  planPeriodLabel,
  planPriceLabel,
  planYearlyTotalLabel,
  publicPlans,
  savingsLabel,
  yearlySavings,
  type BillingInterval,
  type PublicPlan,
} from "../../model/pricingPlans";

export type PricedPlan = PublicPlan & {
  priceLabel: string;
  periodLabel: string | null;
  yearlyTotalLabel: string | null;
  savingsText: string | null;
};

/** Marketing pricing display. Defaults to monthly. No checkout. */
export function usePublicPricing() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const plans: PricedPlan[] = publicPlans.map((plan) => {
    const savings = interval === "yearly" ? yearlySavings(plan) : null;
    return {
      ...plan,
      priceLabel: planPriceLabel(plan, interval),
      periodLabel: planPeriodLabel(plan, interval),
      yearlyTotalLabel: planYearlyTotalLabel(plan, interval),
      savingsText: savings ? savingsLabel(savings) : null,
    };
  });

  return { interval, setInterval, plans };
}
