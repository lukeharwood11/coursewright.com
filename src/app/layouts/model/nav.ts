export type NavMatch = "exact" | "prefix";

export type NavLinkItem = {
  id: string;
  label: string;
  href: string;
  match: NavMatch;
  iconUrl?: string | null;
};

export type NavSection = {
  id: string;
  label: string;
  href: string | null;
  match: NavMatch;
  soon?: boolean;
  /** Unread count badge. Hidden when 0 / unset. */
  badgeCount?: number;
  children: NavLinkItem[];
};

export type NavLists = {
  courses: Array<{ id: string; title: string }>;
  classes: Array<{ id: string; title: string }>;
};

/** Pinned to the bottom of the org sidebar, below a divider. */
export const NAV_FOOTER_SECTION_IDS = new Set(["resources", "settings"]);

export function splitNavSections(sections: NavSection[]): {
  main: NavSection[];
  footer: NavSection[];
} {
  const main: NavSection[] = [];
  const footer: NavSection[] = [];
  for (const section of sections) {
    if (NAV_FOOTER_SECTION_IDS.has(section.id)) {
      footer.push(section);
    } else {
      main.push(section);
    }
  }
  return { main, footer };
}

const VISIBLE_CHILD_LIMIT = 5;
const ACCOUNT_ORG_LIMIT = 12;

function childLinks(
  items: Array<{ id: string; label: string }>,
  hrefFor: (id: string) => string,
  moreHref: string,
): NavLinkItem[] {
  const visible = items.slice(0, VISIBLE_CHILD_LIMIT).map((item) => ({
    id: item.id,
    label: item.label,
    href: hrefFor(item.id),
    match: "exact" as const,
  }));

  const remaining = items.length - visible.length;
  if (remaining <= 0) return visible;

  return [
    ...visible,
    {
      id: "__more__",
      label: remaining === 1 ? "+ 1 other" : `+ ${remaining} others`,
      href: moreHref,
      match: "exact",
    },
  ];
}

export function buildStaffNav(
  orgSlug: string,
  lists: NavLists,
  options?: { unreadDiscussions?: number },
): NavSection[] {
  const base = `/my/${orgSlug}`;
  const unreadDiscussions = options?.unreadDiscussions ?? 0;
  return [
    { id: "home", label: "Home", href: base, match: "exact", children: [] },
    { id: "calendar", label: "Calendar", href: `${base}/calendar`, match: "prefix", children: [] },
    {
      id: "announcements",
      label: "Announcements",
      href: `${base}/announcements`,
      match: "prefix",
      children: [],
    },
    {
      id: "discussions",
      label: "Discussions",
      href: `${base}/discussions`,
      match: "prefix",
      badgeCount: unreadDiscussions > 0 ? unreadDiscussions : undefined,
      children: [],
    },
    {
      id: "courses",
      label: "Courses",
      href: `${base}/courses`,
      match: "prefix",
      children: childLinks(
        lists.courses.map((course) => ({ id: course.id, label: course.title })),
        (id) => `${base}/courses/${id}`,
        `${base}/courses`,
      ),
    },
    {
      id: "roster",
      label: "Roster",
      href: `${base}/roster`,
      match: "prefix",
      children: childLinks(
        lists.classes.map((classGroup) => ({
          id: classGroup.id,
          label: classGroup.title,
        })),
        (id) => `${base}/classes/${id}`,
        `${base}/roster`,
      ),
    },
    {
      id: "resources",
      label: "Resources",
      href: `${base}/resources`,
      match: "prefix",
      children: [],
    },
    {
      id: "settings",
      label: "Settings",
      href: `${base}/settings`,
      match: "prefix",
      children: [],
    },
  ];
}

export function buildParentNav(
  orgSlug: string,
  lists: NavLists,
  options?: {
    unreadAnnouncements?: number;
    unreadDiscussions?: number;
    showResources?: boolean;
  },
): NavSection[] {
  const base = `/my/${orgSlug}`;
  const unreadAnnouncements = options?.unreadAnnouncements ?? 0;
  const unreadDiscussions = options?.unreadDiscussions ?? 0;
  const courseChildren = childLinks(
    lists.courses.map((course) => ({ id: course.id, label: course.title })),
    (id) => `${base}/courses/${id}`,
    `${base}/courses`,
  );

  const sections: NavSection[] = [
    {
      id: "home",
      label: "This week",
      href: base,
      match: "exact",
      children: [],
    },
    {
      id: "calendar",
      label: "Calendar",
      href: `${base}/calendar`,
      match: "prefix",
      children: [],
    },
    {
      id: "announcements",
      label: "Announcements",
      href: `${base}/announcements`,
      match: "prefix",
      badgeCount: unreadAnnouncements > 0 ? unreadAnnouncements : undefined,
      children: [],
    },
    {
      id: "discussions",
      label: "Discussions",
      href: `${base}/discussions`,
      match: "prefix",
      badgeCount: unreadDiscussions > 0 ? unreadDiscussions : undefined,
      children: [],
    },
  ];

  if (courseChildren.length > 0) {
    sections.push({
      id: "courses",
      label: "Courses",
      href: null,
      match: "prefix",
      children: courseChildren,
    });
  }

  if (options?.showResources) {
    sections.push({
      id: "resources",
      label: "Resources",
      href: `${base}/resources`,
      match: "prefix",
      children: [],
    });
  }

  return sections;
}

export function navItemIsActive(
  pathname: string,
  item: { href: string | null; match: NavMatch },
): boolean {
  if (!item.href) return false;
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function collapsedHref(section: NavSection): string | null {
  return section.href ?? section.children[0]?.href ?? null;
}

export function buildAccountNav(
  organizations: Array<{ id: number; name: string; slug: string; iconUrl?: string | null }>,
): NavSection[] {
  return [
    {
      id: "organizations",
      label: "Organizations",
      href: "/my",
      match: "exact",
      children: organizations.slice(0, ACCOUNT_ORG_LIMIT).map((organization) => ({
        id: String(organization.id),
        label: organization.name,
        href: `/my/${organization.slug}`,
        match: "exact",
        iconUrl: organization.iconUrl,
      })),
    },
    {
      id: "account",
      label: "Account",
      href: "/my/settings",
      match: "exact",
      children: [],
    },
  ];
}

