import { helpDocPath, helpDocTopics } from "./helpDocs.ts";

/** Default meta description for the site and home (BRANDING elevator pitch, plain). */
export const SITE_DESCRIPTION =
  "Course Wright helps families, co-ops, and small schools plan courses, organize materials, and print the whole week in one tap.";

export const SITE_NAME = "Course Wright";

export const SITE_TAGLINE = "Courses, done wright.";

/** Social / PWA share image (served from public/). */
export const SITE_OG_IMAGE_PATH = "/logo-course-wright.png";

export type PublicSeoPage = {
  /** Absolute path starting with `/`. */
  path: string;
  /** Short page title (layout appends · Course Wright except on home). */
  title: string;
  description: string;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: number;
};

const marketingPages: PublicSeoPage[] = [
  {
    path: "/",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    changefreq: "weekly",
    priority: 1,
  },
  {
    path: "/about",
    title: "About",
    description:
      "Who Course Wright is for — families, co-ops, and small schools that need one simple hub for courses and materials.",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/pricing",
    title: "Pricing",
    description:
      "Compare Course Wright plans: Family is free, Family Pro is $6 a month or $60 a year, Microschool is $72 a month or $720 a year, and School is $102 a month or $1,020 a year.",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/contact",
    title: "Contact",
    description:
      "Contact Course Wright — partnership and product questions at hi@coursewright.com, support at support@coursewright.com.",
    changefreq: "yearly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    title: "Privacy",
    description:
      "Course Wright privacy policy — how we collect, use, and protect account and organization data.",
    changefreq: "yearly",
    priority: 0.5,
  },
  {
    path: "/terms",
    title: "Terms of use",
    description: "Terms of use for Course Wright accounts, organizations, and the public site.",
    changefreq: "yearly",
    priority: 0.5,
  },
  {
    path: "/cookies",
    title: "Cookie policy",
    description:
      "Cookie policy for Course Wright — essential cookies and analytics when enabled.",
    changefreq: "yearly",
    priority: 0.4,
  },
  {
    path: "/signup",
    title: "Sign up",
    description:
      "Create a Course Wright account and start a workspace for your family, co-op, or small school.",
    changefreq: "monthly",
    priority: 0.8,
  },
];

const docsPages: PublicSeoPage[] = helpDocTopics.map((topic) => ({
  path: helpDocPath(topic.slug),
  title: topic.title,
  description: topic.description,
  changefreq: "monthly" as const,
  priority: topic.slug === "" ? 0.85 : 0.7,
}));

/** Public URLs that belong in the sitemap and get marketing meta. */
export const publicSeoPages: PublicSeoPage[] = [...marketingPages, ...docsPages];

export function publicSeoPageForPath(pathname: string): PublicSeoPage | undefined {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return publicSeoPages.find((page) => page.path === normalized);
}

export function documentTitleForSeoPage(page: PublicSeoPage): string {
  return page.path === "/" ? SITE_NAME : `${page.title} · ${SITE_NAME}`;
}

export function absoluteUrl(host: string, path: string): string {
  const cleanHost = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${cleanHost}${cleanPath === "/" ? "/" : cleanPath}`;
}

/** Only the production apex should be indexed. */
export function isIndexablePublicHost(host: string): boolean {
  const clean = host.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  return clean === "coursewright.com";
}
