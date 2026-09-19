import { contactEmails } from "./contactEmails.ts";
import { publicHost } from "./privacyPolicy.ts";

export type CookieSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

/** Cookie policy body for `/cookies`. Keep aligned with STACK.md + privacyPolicy. */
export const cookieLastUpdated = "September 18, 2026";

export function cookieIntro(host = publicHost()): string {
  return `This Cookie Policy explains how Course Wright (“we”, “us”) uses cookies and similar technologies on ${host}. It should be read together with our Privacy Policy.`;
}

export function cookieSections(host = publicHost()): CookieSection[] {
  return [
    {
      id: "what",
      title: "What we mean by cookies",
      paragraphs: [
        "Cookies are small text files stored on your device when you visit a website. We also use similar technologies such as local storage in your browser. Together they help the site remember signed-in sessions, stay secure, and — when analytics is enabled — understand how the product is used.",
      ],
    },
    {
      id: "essential",
      title: "Essential cookies",
      paragraphs: [
        "These are needed for Course Wright to work. Without them you may not be able to sign in or use the product reliably.",
      ],
      bullets: [
        "Authentication and session — our auth provider (Supabase) uses cookies or similar storage so we can keep you signed in and enforce access rules.",
        "Security and integrity — technologies that help protect accounts and the service (for example, against abuse or forged requests).",
      ],
    },
    {
      id: "analytics",
      title: "Analytics cookies (PostHog)",
      paragraphs: [
        "When analytics is enabled for this site, we use PostHog for product analytics and client error reporting. PostHog may set cookies or use local storage so it can recognize visits, capture page views and page leaves, and report technical exceptions.",
        "We configure PostHog so person profiles are created for identified users only, and we aim not to send more personal information than is needed for analytics and reliability. We do not use PostHog (or any other vendor) for advertising cookies on Course Wright.",
        "You can learn more about PostHog’s practices at posthog.com. Broader privacy details are in our Privacy Policy.",
      ],
    },
    {
      id: "not-used",
      title: "What we do not use",
      paragraphs: [
        "We do not use third-party advertising networks or sell cookie data. We do not claim session replay in this policy unless our product documentation says it is turned on.",
      ],
    },
    {
      id: "manage",
      title: "How to manage cookies",
      paragraphs: [
        "Most browsers let you block or delete cookies and clear local storage through their settings. If you block essential cookies, parts of Course Wright — including sign-in — may not work.",
        "Browser controls vary by device and browser. Check your browser’s help pages for steps. Clearing cookies will usually sign you out of Course Wright on that device.",
      ],
    },
    {
      id: "updates",
      title: "Changes to this policy",
      paragraphs: [
        `We may update this Cookie Policy from time to time. When we do, we will change the “Last updated” date on this page (${host}). Continued use of Course Wright after an update means you accept the revised policy.`,
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        `Questions about cookies or this policy: ${contactEmails.legal}. For a fuller picture of how we handle personal information, see our Privacy Policy.`,
      ],
    },
  ];
}
