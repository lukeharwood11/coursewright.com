/** Public billing period on the marketing pricing page. */
export type BillingInterval = "monthly" | "yearly";

export type PublicPlanId = "family" | "family-pro" | "microschool" | "school";

/**
 * Display-only public ladder. Amounts are whole US dollars.
 * Null monthly/yearly means free on that interval.
 *
 * Family Pro was never committed on main (pricing there was “Free (for now)”).
 * Its price and caps are the previously specified Family Pro row:
 * $5/mo · $49/yr, up to 12 student profiles, up to 3 seats, 10 GB.
 * Microschool yearly is a product display override (`yearlyPriceLabel`), not a yearly total.
 */
export type PublicPlan = {
  id: PublicPlanId;
  name: string;
  monthlyUsd: number | null;
  yearlyUsd: number | null;
  /**
   * When set, the yearly tab shows this string instead of the formatted yearly amount.
   * Savings versus monthly × 12 are omitted.
   */
  yearlyPriceLabel: string | null;
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
    yearlyPriceLabel: null,
    caps: ["Up to 6 student profiles", "Up to 2 collaborators", "2 GB storage"],
    highlights: [],
    freeNote: "Free on monthly and yearly",
  },
  {
    id: "family-pro",
    name: "Family Pro",
    monthlyUsd: 5,
    yearlyUsd: 49,
    yearlyPriceLabel: null,
    caps: ["Up to 12 student profiles", "Up to 3 collaborators", "10 GB storage"],
    highlights: [],
    freeNote: null,
  },
  {
    id: "microschool",
    name: "Microschool",
    monthlyUsd: 79,
    yearlyUsd: null,
    yearlyPriceLabel: "$695/mo",
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
    yearlyPriceLabel: null,
    caps: [
      "Up to 200 student profiles",
      "200 GB storage",
      "Priority support and early access",
    ],
    highlights: ["Includes the Microschool plan"],
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
  if (interval === "yearly" && plan.yearlyPriceLabel) return null;
  return interval === "monthly" ? plan.monthlyUsd : plan.yearlyUsd;
}

export function planPriceLabel(plan: PublicPlan, interval: BillingInterval): string {
  if (interval === "yearly" && plan.yearlyPriceLabel) return plan.yearlyPriceLabel;
  const amount = planAmount(plan, interval);
  return amount == null ? "Free" : formatUsd(amount);
}

export function planPeriodLabel(plan: PublicPlan, interval: BillingInterval): string | null {
  if (interval === "yearly" && plan.yearlyPriceLabel) return null;
  if (planAmount(plan, interval) == null) return null;
  return interval === "monthly" ? "per month" : "per year";
}

/** Yearly price compared with monthly × 12. Null when the plan is free or yearly is a custom label. */
export function yearlySavings(plan: PublicPlan): YearlySavings | null {
  if (plan.yearlyPriceLabel) return null;
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
