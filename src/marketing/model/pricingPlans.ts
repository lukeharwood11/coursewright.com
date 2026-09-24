/** Public billing period on the marketing pricing page. */
export type BillingInterval = "monthly" | "yearly";

export type PublicPlanId = "family" | "coop" | "school";

/**
 * Display-only public ladder.
 * Co-op amounts are locked ($79/mo · $790/yr).
 * School is the working list ($99/mo · $990/yr).
 * Family Pro is omitted on purpose.
 * Amounts are whole US dollars. Null means free on that interval.
 */
export type PublicPlan = {
  id: PublicPlanId;
  name: string;
  monthlyUsd: number | null;
  yearlyUsd: number | null;
  caps: string[];
  highlights: string[];
  /** Shown under a free price. Paid plans leave this null. */
  freeNote: string | null;
};

export const publicPlans: PublicPlan[] = [
  {
    id: "family",
    name: "Family",
    monthlyUsd: null,
    yearlyUsd: null,
    caps: ["Up to 6 student profiles", "Up to 2 staff", "2 GB storage"],
    highlights: [],
    freeNote: "Free on monthly and yearly",
  },
  {
    id: "coop",
    name: "Co-op",
    monthlyUsd: 79,
    yearlyUsd: 790,
    caps: ["Up to 60 student profiles", "Multiple staff", "50 GB storage"],
    highlights: [
      "Full roles: owner, admin, instructor, parent, student",
      "Announcements and discussions",
      "Org Grading and report cards",
      "Branding",
    ],
    freeNote: null,
  },
  {
    id: "school",
    name: "School",
    monthlyUsd: 99,
    yearlyUsd: 990,
    caps: [
      "Up to 200 student profiles",
      "200 GB storage",
      "Priority support and early access",
    ],
    highlights: ["Includes the Co-op plan"],
    freeNote: null,
  },
];

export type YearlySavings = {
  yearlyUsd: number;
  monthlyTimesTwelveUsd: number;
  saveUsd: number;
  /** Whole months of the monthly price covered by the yearly discount. */
  aboutMonths: number;
};

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function planAmount(plan: PublicPlan, interval: BillingInterval): number | null {
  return interval === "monthly" ? plan.monthlyUsd : plan.yearlyUsd;
}

export function planPriceLabel(plan: PublicPlan, interval: BillingInterval): string {
  const amount = planAmount(plan, interval);
  return amount == null ? "Free" : formatUsd(amount);
}

export function planPeriodLabel(plan: PublicPlan, interval: BillingInterval): string | null {
  if (planAmount(plan, interval) == null) return null;
  return interval === "monthly" ? "per month" : "per year";
}

/** Yearly price compared with monthly × 12. Null when the plan is free. */
export function yearlySavings(plan: PublicPlan): YearlySavings | null {
  if (plan.monthlyUsd == null || plan.yearlyUsd == null) return null;
  const monthlyTimesTwelveUsd = plan.monthlyUsd * 12;
  const saveUsd = monthlyTimesTwelveUsd - plan.yearlyUsd;
  if (saveUsd <= 0) return null;
  return {
    yearlyUsd: plan.yearlyUsd,
    monthlyTimesTwelveUsd,
    saveUsd,
    aboutMonths: Math.round(saveUsd / plan.monthlyUsd),
  };
}

export function savingsLabel(savings: YearlySavings): string {
  const months = savings.aboutMonths === 1 ? "month" : "months";
  return `Save ${formatUsd(savings.saveUsd)} (~${savings.aboutMonths} ${months})`;
}

export function savingsCompareLabel(savings: YearlySavings): string {
  return `${formatUsd(savings.monthlyTimesTwelveUsd)} if paid monthly`;
}
