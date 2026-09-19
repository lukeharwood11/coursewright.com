import { contactEmails } from "./contactEmails";

export type PrivacySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

/** Public hostname for this build (`coursewright.com` or `beta.coursewright.com`). */
export function publicHost(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_HOST as string | undefined)?.trim();
  return fromEnv || "coursewright.com";
}

/** Static privacy policy body for `/privacy`. Keep in sync with STACK.md practices. */
export const privacyLastUpdated = "September 18, 2026";

export function privacyIntro(host = publicHost()): string {
  return `This Privacy Policy explains how Course Wright (“we”, “us”) collects, uses, and shares information when you visit ${host} or use the Course Wright product. It is written for co-ops, micro-schools, instructors, and parents who trust us with school and family information.`;
}

export function privacySections(host = publicHost()): PrivacySection[] {
  return [
    {
      id: "who",
      title: "Who we are",
      paragraphs: [
        `Course Wright is a web application that helps homeschool co-ops and micro-schools plan courses, share materials with parents, and run their programs. The service described in this policy is provided at ${host}.`,
      ],
    },
    {
      id: "collect",
      title: "Information we collect",
      paragraphs: [
        "We collect information you provide, information created when you use the product, and limited technical data needed to run and improve the service.",
      ],
      bullets: [
        "Account information — such as your name, email address, and authentication details when you sign up or sign in (including when you use Google sign-in).",
        "Organization and content data — information your organization stores in Course Wright, such as organization settings, roster details, courses, units, materials, files, and parent links, according to the roles and permissions your organization sets.",
        "Usage and device data — such as pages viewed, approximate location derived from IP address, browser type, and similar technical signals needed for security and product analytics.",
        "Support communications — messages you send us about the product or this policy.",
      ],
    },
    {
      id: "use",
      title: "How we use information",
      paragraphs: ["We use the information above to:"],
      bullets: [
        "Provide, maintain, and secure the Course Wright service.",
        "Authenticate users and enforce organization roles and access rules.",
        "Store and deliver the courses, materials, and files your organization chooses to keep in the product.",
        "Understand how the product is used so we can fix problems and improve it.",
        "Detect, investigate, and prevent abuse, outages, and security incidents.",
        "Communicate with you about the service when needed (for example, account or invite-related messages).",
      ],
    },
    {
      id: "analytics",
      title: "Product analytics (PostHog)",
      paragraphs: [
        "When analytics is enabled for this site, we use PostHog to understand how Course Wright is used and to catch errors that affect the product. PostHog may receive events such as page views, page leaves, and technical exception reports from the browser.",
        "We configure PostHog so person profiles are created for identified users only, and we aim not to send more personal information than is needed for product analytics and reliability.",
        "PostHog processes this data on our behalf as a service provider. You can learn more about PostHog’s practices at posthog.com.",
      ],
    },
    {
      id: "providers",
      title: "Service providers",
      paragraphs: [
        "We use trusted vendors to host and operate Course Wright. They process information only to provide services to us, under agreements that limit how they may use it.",
      ],
      bullets: [
        "Supabase — authentication, database, file storage, and related backend services.",
        "Amazon Web Services (AWS) — hosting and delivery of the web application.",
        "Google — when you choose Sign in with Google (identity verification through Google’s OAuth flow).",
        "PostHog — product analytics and client error reporting when enabled, as described above.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and similar technologies",
      paragraphs: [
        "We use cookies and similar technologies that are necessary to keep you signed in and to operate the site securely. When PostHog is enabled, it may also set cookies or use local storage so analytics and error reporting can work across visits.",
        "For more detail, see our Cookie Policy.",
      ],
    },
    {
      id: "sharing",
      title: "When we share information",
      paragraphs: [
        "We do not sell your personal information. We share information in these situations:",
      ],
      bullets: [
        "With service providers who help us run Course Wright (listed above).",
        "Within your organization, according to roles and sharing choices your admins and instructors make (for example, materials shared with parents).",
        "If required by law, legal process, or to protect the rights, safety, or security of Course Wright, our users, or the public.",
        "In connection with a merger, acquisition, or similar corporate transaction, subject to appropriate safeguards.",
      ],
    },
    {
      id: "retention",
      title: "Retention",
      paragraphs: [
        "We keep account and organization data for as long as your organization uses Course Wright and as needed to provide the service. We may retain limited records longer when required for security, dispute resolution, or legal obligations. Analytics events are retained according to our PostHog project settings and operational needs.",
      ],
    },
    {
      id: "security",
      title: "Security",
      paragraphs: [
        "We use industry-standard measures appropriate to a hosted web application, including access controls and encrypted connections (HTTPS). No method of transmission or storage is completely secure; we work to protect your information and to improve our practices over time.",
      ],
    },
    {
      id: "children",
      title: "Children’s information",
      paragraphs: [
        "Course Wright is built for organizations that serve students, including minors. Student-related information is entered and managed by the organization (and invited parents), not by Course Wright soliciting data directly from children for marketing.",
        `If you believe we have collected information from a child in a way that is inconsistent with this policy or applicable law, email ${contactEmails.legal} and we will take appropriate steps.`,
      ],
    },
    {
      id: "choices",
      title: "Your choices",
      paragraphs: [
        "Depending on where you live, you may have rights to access, correct, delete, or export personal information, or to object to certain processing. Organization admins control much of the content stored for their co-op or school.",
        `To update account details, use account settings while signed in. For organization-held roster or course data, start with your organization’s administrator. For other privacy requests, email ${contactEmails.legal}.`,
      ],
    },
    {
      id: "international",
      title: "Where information is processed",
      paragraphs: [
        "Course Wright is operated from the United States. Our service providers may process data in the United States and other countries where they maintain facilities. If you access the service from another country, you understand that information may be transferred to and processed in the United States.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. When we do, we will change the “Last updated” date at the top of this page. Continued use of Course Wright after an update means you accept the revised policy.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        `Questions about this Privacy Policy or our privacy practices: ${contactEmails.legal}. If your question is about data your organization stores in Course Wright, your organization administrator is usually the fastest place to start.`,
      ],
    },
  ];
}
