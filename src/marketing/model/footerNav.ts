export type FooterLink = {
  to: string;
  label: string;
  /** False → shared in-construction placeholder (no invented legal/contact copy). */
  ready: boolean;
};

export type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

/** Site-footer destinations. Construction pages reuse this so the lists stay in sync. */
export const footerColumns: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { to: "/", label: "Home", ready: true },
      { to: "/about", label: "About", ready: true },
      { to: "/pricing", label: "Pricing", ready: true },
    ],
  },
  {
    heading: "Account",
    links: [
      { to: "/login", label: "Sign in", ready: true },
      { to: "/signup", label: "Sign up", ready: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { to: "/contact", label: "Contact us", ready: false },
      { to: "/privacy", label: "Privacy", ready: false },
      { to: "/terms", label: "Terms of use", ready: false },
      { to: "/cookies", label: "Cookie policy", ready: false },
    ],
  },
];

export const footerLinks: FooterLink[] = footerColumns.flatMap((column) => column.links);

export const constructionPaths = footerLinks
  .filter((link) => !link.ready)
  .map((link) => link.to);

export function footerLinkForPath(pathname: string): FooterLink | undefined {
  return footerLinks.find((link) => link.to === pathname);
}
