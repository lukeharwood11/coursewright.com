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

/** Static privacy policy body for `/privacy`. Keep in sync with STACK.md practices.
 * Google OAuth branding verification requires a dedicated “Google user data” disclosure
 * (access, use, share, protect, retain/delete) — see section `google-user-data`. */
export const privacyLastUpdated = "September 19, 2026";

export function privacyIntro(host = publicHost()): string {
  return `This Privacy Policy explains how Course Wright (“we”, “us”) collects, uses, stores, and shares information when you visit ${host} or use the Course Wright product — including Google user data when you choose Sign in with Google. It is written for co-ops, micro-schools, instructors, and parents who trust us with school and family information.`;
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
      id: "google-user-data",
      title: "Google user data",
      paragraphs: [
        "Course Wright offers Sign in with Google so you can create or access an account without a separate password. When you choose that option, we access Google user data through Google’s OAuth consent flow (via our authentication provider, Supabase Auth). This section explains how we access, use, store, and share that Google user data.",
      ],
      bullets: [
        "What Google user data we access — With your consent, we receive basic account profile information from Google that is needed to sign you in: typically your Google account email address, your name, and (when Google provides it) a profile photo URL. We do not request access to your Gmail, Google Drive, Google Calendar, Contacts, or other Google product content.",
        "How we use Google user data — We use this Google user data only to create and authenticate your Course Wright account, display your name in the product, associate you with organization memberships and invites that match your email, and keep you signed in securely. We do not use Google user data for advertising, remarketing, credit decisions, or sale to data brokers.",
        "How we store and protect Google user data — Google user data used for sign-in is stored with our authentication and database provider (Supabase) and delivered over encrypted connections (HTTPS). Access is limited by account authentication and organization role controls. We apply industry-standard safeguards appropriate to a hosted web application.",
        "How we share Google user data — We do not sell Google user data. We share it only with service providers that process it on our behalf to operate Course Wright (notably Supabase for authentication and account storage, and Amazon Web Services for hosting the application), within your organization according to roles your admins set, or when required by law or to protect security. We do not transfer Google user data to independent third parties for their own marketing or advertising purposes.",
        "Retention and deletion of Google user data — We keep Google-linked account information for as long as your Course Wright account remains active and as needed to provide the service. If you delete your account, or ask us to delete personal information associated with it, we will delete or de-identify that Google user data from our systems except where we must retain limited records for security, dispute resolution, or legal obligations. You may also revoke Course Wright’s access to your Google account in your Google Account permissions; after revocation you will need another sign-in method or to reconnect Google to use Sign in with Google again.",
        "Limited use — Our use of Google user data complies with the Google API Services User Data Policy, including the Limited Use requirements: we use this data only to provide or improve user-facing Course Wright features that are visible in the product (sign-in and account identity), and not for serving ads.",
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
        "Google — Sign in with Google / OAuth identity verification; see “Google user data” above for how we access, use, store, and share Google user data.",
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
        "We keep account and organization data for as long as your organization uses Course Wright and as needed to provide the service. We may retain limited records longer when required for security, dispute resolution, or legal obligations. Analytics events are retained according to our PostHog project settings and operational needs. Retention and deletion of Google user data is also described in the “Google user data” section above.",
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
        `Questions about this Privacy Policy, our privacy practices, or Google user data: ${contactEmails.legal}. If your question is about data your organization stores in Course Wright, your organization administrator is usually the fastest place to start.`,
      ],
    },
  ];
}
