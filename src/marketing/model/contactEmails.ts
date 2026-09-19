export type ContactEmail = {
  address: string;
  label: string;
  purpose: string;
};

/** Public Course Wright inboxes — reuse across marketing pages. */
export const contactEmails = {
  hi: "hi@coursewright.com",
  support: "support@coursewright.com",
  legal: "legal@coursewright.com",
} as const;

export type ContactEmailKey = keyof typeof contactEmails;

export const contactDirectory: ContactEmail[] = [
  {
    address: contactEmails.hi,
    label: "General & partnerships",
    purpose: "Pilot interest, partnerships, and anything that isn’t product support.",
  },
  {
    address: contactEmails.support,
    label: "Product support",
    purpose: "Help using Course Wright once you’re in an organization.",
  },
];

export function mailto(address: string): string {
  return `mailto:${address}`;
}
