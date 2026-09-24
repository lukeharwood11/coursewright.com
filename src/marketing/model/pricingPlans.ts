/** Public billing period on the marketing pricing page. */
export type BillingInterval = "monthly" | "yearly";

export type PublicPlanId = "family" | "family-pro" | "microschool" | "school";

export type PublicPlanFeature = {
  title: string;
  description: string;
};

/**
 * Display-only public ladder. Amounts are whole US dollars.
 * Null monthly/yearly means free on that interval.
 *
 * Family Pro was never committed on main (pricing there was “Free (for now)”).
 * Its price and caps are the previously specified Family Pro row:
 * $6/mo · $60/yr, up to 12 student profiles, up to 3 seats, 10 GB.
 */
export type PublicPlan = {
  id: PublicPlanId;
  name: string;
  monthlyUsd: number | null;
  yearlyUsd: number | null;
  caps: string[];
  highlights: string[];
  detailIntro: string;
  features: PublicPlanFeature[];
  /** Shown under a free price. Paid plans leave this null. */
  freeNote: string | null;
};

const coreCourseFeatures: PublicPlanFeature[] = [
  {
    title: "Course builder",
    description:
      "Create courses with units, pages, files, links, and quizzes. Materials can live inside a unit or directly on the course.",
  },
  {
    title: "Weekly planning",
    description:
      "Add lesson plans and dates so assigned work, due work, and important materials appear in a clear This week view.",
  },
  {
    title: "Sharing and print",
    description:
      "Share signed-in material links and print a material, unit, quiz, or the full weekly packet.",
  },
  {
    title: "Reuse courses",
    description:
      "Create a new course from a previous course so you can reuse content without changing the original.",
  },
];

export const publicPlans: PublicPlan[] = [
  {
    id: "family",
    name: "Family",
    monthlyUsd: null,
    yearlyUsd: null,
    caps: ["Up to 2 student profiles", "1 collaborator", "1 GB storage"],
    highlights: [],
    detailIntro:
      "For a family or independent course creator who wants the complete course-building, sharing, and print workflow with a small roster.",
    features: coreCourseFeatures,
    freeNote: "Free on monthly and yearly",
  },
  {
    id: "family-pro",
    name: "Family Pro",
    monthlyUsd: 6,
    yearlyUsd: 60,
    caps: ["Up to 12 student profiles", "Up to 3 collaborators", "10 GB storage"],
    highlights: [],
    detailIntro:
      "For larger families and small learning groups that need more student profiles, collaborators, and storage.",
    features: [
      {
        title: "Everything in Family",
        description:
          "Keep the same course builder, weekly planning, sharing, print, and course-reuse tools from the free plan.",
      },
      {
        title: "More room to collaborate",
        description:
          "Manage up to 12 student profiles with up to 3 collaborators and 10 GB of file storage.",
      },
    ],
    freeNote: null,
  },
  {
    id: "microschool",
    name: "Microschool",
    monthlyUsd: 72,
    yearlyUsd: 720,
    caps: ["Up to 60 student profiles", "Multiple staff", "50 GB storage"],
    highlights: [
      "Full roles: owner, admin, instructor, parent, student",
      "Announcements and discussions",
      "Org Grading and report cards",
      "Branding",
    ],
    detailIntro:
      "For co-ops, micro-schools, and other small learning organizations that need staff roles, communication, grading, and their own identity.",
    features: [
      {
        title: "Everything in Family Pro",
        description:
          "Keep all course-building, weekly planning, sharing, print, reuse, and collaboration tools from Family Pro.",
      },
      {
        title: "Separate roles for the whole organization",
        description:
          "Give owners, admins, instructors, parents, and students the access that matches what they need to do.",
      },
      {
        title: "Announcements and discussions",
        description:
          "Send one-way updates and use two-way course or class discussions without moving the conversation to another tool.",
      },
      {
        title: "Grading and report cards",
        description:
          "Use an organization grading scale, course gradebooks, student progress views, and submitted report cards.",
      },
      {
        title: "Organization branding",
        description:
          "Upload a small icon and choose an accessible accent color for buttons, links, and organization chrome.",
      },
    ],
    freeNote: null,
  },
  {
    id: "school",
    name: "School",
    monthlyUsd: 102,
    yearlyUsd: 1020,
    caps: [
      "Up to 200 student profiles",
      "200 GB storage",
      "Priority support and early access",
    ],
    highlights: ["Includes the Microschool plan"],
    detailIntro:
      "For established small schools that need the full Microschool toolkit with more capacity and hands-on support.",
    features: [
      {
        title: "Everything in Microschool",
        description:
          "Keep the complete Microschool feature set, including roles, communication, grading, report cards, and branding.",
      },
      {
        title: "Capacity for a larger program",
        description:
          "Manage up to 200 student profiles and store up to 200 GB of course files and materials.",
      },
      {
        title: "Priority support",
        description:
          "Get faster help when your team has a product question or needs assistance.",
      },
      {
        title: "Early access",
        description:
          "Evaluate selected new Course Wright capabilities before they become generally available.",
      },
    ],
    freeNote: null,
  },
];

export type YearlySavings = {
  yearlyUsd: number;
  monthlyTimesTwelveUsd: number;
  saveUsd: number;
  /** Whole months of the monthly price covered by the yearly discount. */
  monthsSaved: number;
};

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonthlyUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function planAmount(plan: PublicPlan, interval: BillingInterval): number | null {
  return interval === "monthly" ? plan.monthlyUsd : plan.yearlyUsd;
}

export function planPriceLabel(plan: PublicPlan, interval: BillingInterval): string {
  const amount = planAmount(plan, interval);
  if (amount == null) return "Free";
  return interval === "yearly" ? formatMonthlyUsd(amount / 12) : formatUsd(amount);
}

export function planPeriodLabel(plan: PublicPlan, interval: BillingInterval): string | null {
  if (planAmount(plan, interval) == null) return null;
  return "per month";
}

export function planYearlyTotalLabel(
  plan: PublicPlan,
  interval: BillingInterval,
): string | null {
  if (interval !== "yearly" || plan.yearlyUsd == null) return null;
  return `${formatUsd(plan.yearlyUsd)} billed yearly`;
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
    monthsSaved: Math.round(saveUsd / plan.monthlyUsd),
  };
}

export function savingsLabel(savings: YearlySavings): string {
  const months = savings.monthsSaved === 1 ? "month" : "months";
  return `Save ${formatUsd(savings.saveUsd)} (${savings.monthsSaved} ${months})`;
}

export function savingsCompareLabel(savings: YearlySavings): string {
  return `${formatUsd(savings.monthlyTimesTwelveUsd)} if paid monthly`;
}
