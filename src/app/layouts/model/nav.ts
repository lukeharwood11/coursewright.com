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

export type NavFeatureFlags = {
  calendar?: boolean;
  announcements?: boolean;
  discussions?: boolean;
  resources?: boolean;
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
  options?: NavFeatureFlags & { unreadDiscussions?: number },
): NavSection[] {
  const base = `/my/${orgSlug}`;
  const unreadDiscussions = options?.unreadDiscussions ?? 0;
  const showCalendar = options?.calendar !== false;
  const showAnnouncements = options?.announcements !== false;
  const showDiscussions = options?.discussions !== false;
  const showResources = options?.resources !== false;
  const sections: NavSection[] = [
    { id: "home", label: "Home", href: base, match: "exact", children: [] },
  ];

  if (showCalendar) {
    sections.push({
      id: "calendar",
      label: "Calendar",
      href: `${base}/calendar`,
      match: "prefix",
      children: [],
    });
  }
  if (showAnnouncements) {
    sections.push({
      id: "announcements",
      label: "Announcements",
      href: `${base}/announcements`,
      match: "prefix",
      children: [],
    });
  }
  if (showDiscussions) {
    sections.push({
      id: "discussions",
      label: "Discussions",
      href: `${base}/discussions`,
      match: "prefix",
      badgeCount: unreadDiscussions > 0 ? unreadDiscussions : undefined,
      children: [],
    });
  }

  sections.push(
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
      id: "students",
      label: "Students",
      href: `${base}/students`,
      match: "prefix",
      children: [],
    },
  );

  if (showResources) {
    sections.push({
      id: "resources",
      label: "Resources",
      href: `${base}/resources`,
      match: "prefix",
      children: [],
    });
  }

  sections.push({
    id: "settings",
    label: "Settings",
    href: `${base}/settings`,
    match: "prefix",
    children: [],
  });

  return sections;
}

export function buildParentNav(
  orgSlug: string,
  lists: NavLists,
  options?: NavFeatureFlags & {
    unreadAnnouncements?: number;
    unreadDiscussions?: number;
    showResources?: boolean;
  },
): NavSection[] {
  const base = `/my/${orgSlug}`;
  const unreadAnnouncements = options?.unreadAnnouncements ?? 0;
  const unreadDiscussions = options?.unreadDiscussions ?? 0;
  const showCalendar = options?.calendar !== false;
  const showAnnouncements = options?.announcements !== false;
  const showDiscussions = options?.discussions !== false;
  const sections: NavSection[] = [
    {
      id: "home",
      label: "This week",
      href: base,
      match: "exact",
      children: [],
    },
  ];

  if (showCalendar) {
    sections.push({
      id: "calendar",
      label: "Calendar",
      href: `${base}/calendar`,
      match: "prefix",
      children: [],
    });
  }
  if (showAnnouncements) {
    sections.push({
      id: "announcements",
      label: "Announcements",
      href: `${base}/announcements`,
      match: "prefix",
      badgeCount: unreadAnnouncements > 0 ? unreadAnnouncements : undefined,
      children: [],
    });
  }
  if (showDiscussions) {
    sections.push({
      id: "discussions",
      label: "Discussions",
      href: `${base}/discussions`,
      match: "prefix",
      badgeCount: unreadDiscussions > 0 ? unreadDiscussions : undefined,
      children: [],
    });
  }

  sections.push(
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
      id: "students",
      label: "Students",
      href: `${base}/students`,
      match: "prefix",
      children: [],
    },
  );

  if (options?.showResources && options?.resources !== false) {
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

/** Learner chrome. Own Progress — not the staff/parent Students hub. */
export function buildLearnerNav(
  orgSlug: string,
  lists: NavLists,
  options?: NavFeatureFlags & {
    unreadAnnouncements?: number;
    unreadDiscussions?: number;
    showResources?: boolean;
    /** Defaults true. Staff Preview omits Progress (no linked student account). */
    showProgress?: boolean;
  },
): NavSection[] {
  const base = `/my/${orgSlug}`;
  const unreadAnnouncements = options?.unreadAnnouncements ?? 0;
  const unreadDiscussions = options?.unreadDiscussions ?? 0;
  const showCalendar = options?.calendar !== false;
  const showAnnouncements = options?.announcements !== false;
  const showDiscussions = options?.discussions !== false;
  const showProgress = options?.showProgress !== false;
  const sections: NavSection[] = [
    {
      id: "home",
      label: "This week",
      href: base,
      match: "exact",
      children: [],
    },
  ];

  if (showCalendar) {
    sections.push({
      id: "calendar",
      label: "Calendar",
      href: `${base}/calendar`,
      match: "prefix",
      children: [],
    });
  }
  if (showAnnouncements) {
    sections.push({
      id: "announcements",
      label: "Announcements",
      href: `${base}/announcements`,
      match: "prefix",
      badgeCount: unreadAnnouncements > 0 ? unreadAnnouncements : undefined,
      children: [],
    });
  }
  if (showDiscussions) {
    sections.push({
      id: "discussions",
      label: "Discussions",
      href: `${base}/discussions`,
      match: "prefix",
      badgeCount: unreadDiscussions > 0 ? unreadDiscussions : undefined,
      children: [],
    });
  }

  if (showProgress) {
    sections.push({
      id: "progress",
      label: "Progress",
      href: `${base}/progress`,
      match: "prefix",
      children: [],
    });
  }

  sections.push({
    id: "courses",
    label: "Courses",
    href: `${base}/courses`,
    match: "prefix",
    children: childLinks(
      lists.courses.map((course) => ({ id: course.id, label: course.title })),
      (id) => `${base}/courses/${id}`,
      `${base}/courses`,
    ),
  });

  if (options?.showResources && options?.resources !== false) {
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

