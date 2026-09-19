import { contactEmails } from "./contactEmails";
import { publicHost } from "./privacyPolicy";

export type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

/** Static terms of use body for `/terms`. Generic pilot copy — lawyer review can refine later. */
export const termsLastUpdated = "September 19, 2026";

export function termsIntro(host = publicHost()): string {
  return `These Terms of Use (“Terms”) govern your access to and use of Course Wright at ${host} and the related product (the “Service”). By creating an account, joining an organization, or using the Service, you agree to these Terms.`;
}

export function termsSections(host = publicHost()): TermsSection[] {
  return [
    {
      id: "agreement",
      title: "Agreement to these Terms",
      paragraphs: [
        "If you use Course Wright on behalf of an organization (for example, a co-op or micro-school), you confirm that you have authority to bind that organization to these Terms, and “you” includes that organization.",
        "If you do not agree to these Terms, do not use the Service.",
      ],
    },
    {
      id: "service",
      title: "The Service",
      paragraphs: [
        `Course Wright is a web application that helps organizations plan courses, share materials with parents, and run their programs. The Service is provided at ${host} and may change as we improve the product.`,
        "We may update, suspend, or discontinue features from time to time. We will try to avoid unnecessary disruption, but we do not guarantee that any particular feature will remain available forever.",
      ],
    },
    {
      id: "accounts",
      title: "Accounts and eligibility",
      paragraphs: [
        "You need an account to use most of the Service. You agree to provide accurate information and to keep your sign-in credentials secure. You are responsible for activity under your account.",
        "You must be able to form a binding contract under applicable law. If you are under the age required in your jurisdiction to agree to these Terms on your own, you may only use the Service with the involvement of a parent, guardian, or your organization as applicable.",
      ],
    },
    {
      id: "organizations",
      title: "Organizations and roles",
      paragraphs: [
        "Much of Course Wright is organized around Organizations. Organization owners and admins control membership, roles (such as instructor or parent), and what content is shared within that organization.",
        "If you are invited into an organization, you agree to use the Service only as permitted by that organization’s administrators and these Terms. Organization administrators are responsible for the people they invite and for the content their organization stores.",
      ],
    },
    {
      id: "content",
      title: "Your content",
      paragraphs: [
        "You (or your organization) retain ownership of the courses, materials, files, roster information, and other content you submit to the Service (“Your Content”).",
        "You grant Course Wright a limited license to host, store, display, transmit, and otherwise process Your Content solely as needed to operate and improve the Service and as directed by your organization’s settings and sharing choices.",
        "You represent that you have the rights needed to submit Your Content and to grant this license, and that Your Content does not violate law or someone else’s rights.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      paragraphs: ["You agree not to:"],
      bullets: [
        "Use the Service for anything unlawful, harmful, or fraudulent.",
        "Upload malware, attempt to gain unauthorized access, or disrupt the Service or other users.",
        "Harass, abuse, or invade the privacy of others, including students and families.",
        "Scrape, reverse engineer, or overload the Service except as allowed by law.",
        "Misrepresent your identity or affiliation, or misuse invites and access links.",
        "Use the Service to send spam or unsolicited commercial messages unrelated to running your organization.",
      ],
    },
    {
      id: "our-ip",
      title: "Course Wright’s intellectual property",
      paragraphs: [
        "The Service — including its software, design, branding, and documentation — is owned by Course Wright and its licensors. These Terms do not give you ownership of the Service. You may not copy, modify, or create derivative works of our software or branding except as we expressly allow.",
      ],
    },
    {
      id: "third-parties",
      title: "Third-party services",
      paragraphs: [
        "The Service relies on third-party providers (for example, for hosting, authentication, storage, and analytics). Your use of those providers’ features may also be subject to their terms. We are not responsible for third-party services we do not control.",
        "Links or integrations to outside sites or tools are provided for convenience; we do not endorse and are not responsible for their content or practices.",
      ],
    },
    {
      id: "privacy",
      title: "Privacy",
      paragraphs: [
        "How we collect and use personal information is described in our Privacy Policy and Cookie Policy. By using the Service, you acknowledge those policies.",
      ],
    },
    {
      id: "pricing",
      title: "Pricing and free access",
      paragraphs: [
        "Course Wright may be offered free of charge for now while we work with organizations to polish the product. We may introduce or change pricing, packaging, or plan limits in the future. If we do, we will communicate changes in a reasonable way before they apply to paying customers.",
        "Unless we agree otherwise in writing, free access does not create an obligation for us to provide any particular service level, support commitment, or continued free use.",
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimers",
      paragraphs: [
        'THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, COURSE WRIGHT DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
        "We do not warrant that the Service will be uninterrupted, error-free, or completely secure, or that content will never be lost. You are responsible for maintaining appropriate backups of important materials outside the Service when needed.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, COURSE WRIGHT AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE.",
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE IS LIMITED TO THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US $100).",
        "Some jurisdictions do not allow certain limitations; in those places, our liability is limited to the fullest extent permitted by law.",
      ],
    },
    {
      id: "indemnity",
      title: "Indemnification",
      paragraphs: [
        "You agree to defend, indemnify, and hold harmless Course Wright and its operators from claims, damages, losses, and expenses (including reasonable attorneys’ fees) arising out of Your Content, your use of the Service, or your violation of these Terms or applicable law — except to the extent caused by our willful misconduct.",
      ],
    },
    {
      id: "termination",
      title: "Suspension and termination",
      paragraphs: [
        "You may stop using the Service at any time. Organization admins may remove members or delete organization content according to product controls.",
        "We may suspend or terminate access if you violate these Terms, if required by law, or if needed to protect the Service or other users. We may also discontinue the Service. Where practical, we will provide notice.",
        "Provisions that by their nature should survive (including ownership, disclaimers, limitations of liability, and indemnity) will survive termination.",
      ],
    },
    {
      id: "changes",
      title: "Changes to these Terms",
      paragraphs: [
        `We may update these Terms from time to time. When we do, we will change the “Last updated” date on this page (${host}). If a change is material, we may also provide additional notice (for example, by email or an in-product message). Continued use of the Service after an update means you accept the revised Terms.`,
      ],
    },
    {
      id: "law",
      title: "Governing law",
      paragraphs: [
        "These Terms are governed by the laws of the United States, without regard to conflict-of-law rules, except where mandatory consumer protections in your place of residence require otherwise.",
        "If a dispute arises, you agree to first try to resolve it informally by contacting us. Courts of competent jurisdiction in the United States will hear disputes arising from these Terms, except where prohibited by law.",
      ],
    },
    {
      id: "general",
      title: "General",
      paragraphs: [
        "These Terms are the entire agreement between you and Course Wright regarding the Service and replace any prior agreements on that subject. If any provision is found unenforceable, the rest remains in effect. Our failure to enforce a provision is not a waiver. You may not assign these Terms without our consent; we may assign them in connection with a merger, acquisition, or sale of assets.",
        "Nothing in these Terms creates a partnership, employment, or agency relationship between you and Course Wright.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        `Questions about these Terms: ${contactEmails.legal}. For product help, use ${contactEmails.support}. For partnerships or general inquiries, use ${contactEmails.hi}.`,
      ],
    },
  ];
}
