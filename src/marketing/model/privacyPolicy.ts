import { contactEmails } from "./contactEmails.ts";

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

/**
 * Static privacy policy body for `/privacy`.
 *
 * Google OAuth branding verification requires the policy (and homepage link to it)
 * to clearly disclose how the app accesses, uses, stores, and shares Google user data.
 * Keep Google disclosures early and as dedicated headings — automated checks are picky.
 */
export const privacyLastUpdated = "September 19, 2026";

export function privacyIntro(host = publicHost()): string {
  return `This Privacy Policy applies specifically to the Course Wright application available at https://${host} (including Sign in with Google). It explains Course Wright’s data collection and usage practices — including how we access, use, store, and share Google user data. It is written for families, co-ops, small schools, instructors, students, and parents who trust us with school and family information. This is not a sample or template policy; it describes Course Wright’s actual practices.`;
}

export function privacySections(host = publicHost()): PrivacySection[] {
  return [
    {
      id: "data-collection-and-usage",
      title: "App data collection and usage",
      paragraphs: [
        "Course Wright is a web application for families, co-ops, and small schools to plan courses, organize materials, and share or print the week. This section summarizes what personal data the app collects and how that data is used.",
        "Data collection: We collect account information you provide (name, email address, and sign-in credentials), organization and content data your family, co-op, or school stores in the product (roster details, courses, units, materials, files, and parent links), usage and device data needed for security and product analytics (such as pages viewed, approximate location from IP address, and browser type), and messages you send us for support.",
        "Data usage: We use this information to provide, maintain, and secure the Course Wright service; authenticate users and enforce organization roles; store and deliver course materials; improve the product; prevent abuse; and communicate about accounts and invites. We do not sell personal information. We do not use personal information for third-party advertising.",
        "When you use Sign in with Google, we also process Google user data as described in the dedicated sections below (access, use, storage, sharing, and retention/deletion).",
      ],
    },
    {
      id: "google-user-data",
      title: "Google user data",
      paragraphs: [
        "Course Wright offers Sign in with Google so you can create or access an account. When you choose that option, Course Wright accesses Google user data through Google’s OAuth consent screen (via our authentication provider, Supabase Auth).",
        "Google OAuth scopes we request: we only request basic sign-in identity scopes needed for authentication — typically openid, email, and profile. We do not request Gmail, Google Drive, Google Calendar, Contacts, or other Google product content scopes.",
      ],
    },
    {
      id: "google-access",
      title: "How Course Wright accesses Google user data",
      paragraphs: [
        "With your consent on Google’s OAuth consent screen, Course Wright accesses the following Google user data: your Google account email address, your name, and (when Google provides it) a profile photo URL.",
        "We access this Google user data only at sign-in / account linking time through the OAuth flow. We do not continuously scrape or pull additional Google user data in the background.",
      ],
    },
    {
      id: "google-use",
      title: "How Course Wright uses Google user data",
      paragraphs: [
        "Course Wright uses Google user data only to create and authenticate your Course Wright account, display your name in the product, match invites and organization memberships to your email address, and keep you signed in securely.",
        "We do not use Google user data for advertising, remarketing, personalized ads, credit decisions, lending, or sale to data brokers. Our use of Google user data is limited to providing user-facing sign-in and account identity features that are visible in the Course Wright app.",
      ],
    },
    {
      id: "google-store",
      title: "How Course Wright stores and protects Google user data",
      paragraphs: [
        "Google user data used for sign-in is stored with our authentication and database provider (Supabase) as part of your Course Wright account record, and the Course Wright application is hosted on Amazon Web Services (AWS).",
        "Data protection mechanisms: We protect Google user data and other personal information with encrypted connections in transit (HTTPS/TLS), access controls that require authentication, and organization role-based authorization so only authorized members can see relevant account information. Where Google user data could be considered sensitive in context (for example, account credentials and identifiers used for sign-in), we apply these same protections and limit access to systems and personnel needed to operate Course Wright.",
        "No method of transmission or storage is completely secure; we work to protect your information and improve our practices over time.",
      ],
    },
    {
      id: "google-share",
      title: "How Course Wright shares Google user data",
      paragraphs: [
        "We do not sell Google user data. We do not transfer Google user data to third parties for advertising, data brokerage, or any purpose other than providing or improving Course Wright’s user-facing functionality.",
        "We share Google user data only: (1) with service providers that process it on our behalf solely to provide or improve Course Wright (notably Supabase for authentication/account storage and AWS for application hosting); (2) within your organization according to roles your admins set (for example, your name/email as a member); (3) when required by law or to protect security; or (4) as part of a merger, acquisition, or similar corporate transaction with appropriate safeguards and, where required, notice or consent.",
      ],
    },
    {
      id: "google-retain",
      title: "How Course Wright retains and deletes Google user data",
      paragraphs: [
        "We retain Google-linked account information for as long as your Course Wright account remains active and as needed to provide the service.",
        "If you delete your Course Wright account, or email us to request deletion of personal information associated with it, we will delete or de-identify that Google user data from our systems except where we must retain limited records for security, dispute resolution, or legal obligations.",
        "You may also revoke Course Wright’s access to your Google Account in your Google Account permissions settings. After revocation, Sign in with Google will stop working until you reconnect it; you may still use email sign-in if your account supports it.",
        `Deletion and privacy requests: ${contactEmails.legal}.`,
      ],
    },
    {
      id: "google-limited-use",
      title: "Google API Services User Data Policy and Limited Use",
      paragraphs: [
        "Course Wright’s use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
        "We use Google user data only to provide or improve user-facing features that are prominent in the Course Wright user interface (sign-in and account identity). We do not transfer Google user data to third parties for serving ads, data brokerage, or creditworthiness determinations.",
      ],
    },
    {
      id: "who",
      title: "Who we are",
      paragraphs: [
        `Course Wright is a web application that helps families, co-ops, and small schools plan courses, organize materials, and share or print the week. The service described in this policy is provided at ${host}.`,
      ],
    },
    {
      id: "collect",
      title: "Information we collect",
      paragraphs: [
        "In addition to the summary above, we collect the following categories of information:",
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
        "Supabase — authentication, database, file storage, and related backend services (including storage of Google sign-in account data described above).",
        "Amazon Web Services (AWS) — hosting and delivery of the web application.",
        "Google — Sign in with Google / OAuth identity verification; see the Google user data sections above for how we access, use, store, and share Google user data.",
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
        "Within your organization, according to roles and sharing choices your admins and instructors make (for example, materials shared with students).",
        "If required by law, legal process, or to protect the rights, safety, or security of Course Wright, our users, or the public.",
        "In connection with a merger, acquisition, or similar corporate transaction, subject to appropriate safeguards.",
      ],
    },
    {
      id: "retention",
      title: "Retention",
      paragraphs: [
        "We keep account and organization data for as long as your organization uses Course Wright and as needed to provide the service. We may retain limited records longer when required for security, dispute resolution, or legal obligations. Analytics events are retained according to our PostHog project settings and operational needs. Retention and deletion of Google user data is also described in the Google sections above.",
      ],
    },
    {
      id: "security",
      title: "Security",
      paragraphs: [
        "We use industry-standard measures appropriate to a hosted web application, including access controls and encrypted connections (HTTPS), to protect personal information and Google user data. No method of transmission or storage is completely secure; we work to protect your information and to improve our practices over time.",
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
        `To update account details, use account settings while signed in. For organization-held roster or course data, start with your organization’s administrator. To revoke Google access, use your Google Account permissions or contact us. For other privacy requests, email ${contactEmails.legal}.`,
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
        "We may update this Privacy Policy from time to time. When we do, we will change the “Last updated” date at the top of this page. Continued use of Course Wright after an update means you accept the revised policy. We keep this policy up to date regarding how Course Wright uses Google user data.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        `Questions about this Privacy Policy, our data collection and usage practices, or Google user data: ${contactEmails.legal}. If your question is about data your organization stores in Course Wright, your organization administrator is usually the fastest place to start.`,
      ],
    },
  ];
}
