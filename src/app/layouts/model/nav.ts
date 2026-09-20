export type NavMatch = "exact" | "prefix";

export type NavLinkItem = {
  id: string;
  label: string;
  href: string;
  match: NavMatch;
};

export type NavSection = {
  id: string;
  label: string;
  href: string | null;
  match: NavMatch;
  soon?: boolean;
  children: NavLinkItem[];
};

export type NavLists = {
  courses: Array<{ id: string; title: string }>;
  classes: Array<{ id: string; title: string }>;
};

const CHILD_LIMIT = 12;

function childLinks(
  items: Array<{ id: string; label: string }>,
  hrefFor: (id: string) => string,
): NavLinkItem[] {
  return items.slice(0, CHILD_LIMIT).map((item) => ({
    id: item.id,
    label: item.label,
    href: hrefFor(item.id),
    match: "exact",
  }));
}

export function buildStaffNav(orgSlug: string, lists: NavLists): NavSection[] {
  const base = `/my/${orgSlug}`;
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
      id: "courses",
      label: "Courses",
      href: `${base}/courses`,
      match: "prefix",
      children: childLinks(
        lists.courses.map((course) => ({ id: course.id, label: course.title })),
        (id) => `${base}/courses/${id}`,
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
      ),
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

export function buildParentNav(orgSlug: string, lists: NavLists): NavSection[] {
  const base = `/my/${orgSlug}`;
  const courseChildren = childLinks(
    lists.courses.map((course) => ({ id: course.id, label: course.title })),
    (id) => `${base}/courses/${id}`,
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

  sections.push({
    id: "progress",
    label: "Progress",
    href: null,
    match: "exact",
    soon: true,
    children: [],
  });

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
  organizations: Array<{ id: number; name: string; slug: string }>,
): NavSection[] {
  return [
    {
      id: "organizations",
      label: "Organizations",
      href: "/my",
      match: "exact",
      children: organizations.slice(0, CHILD_LIMIT).map((organization) => ({
        id: String(organization.id),
        label: organization.name,
        href: `/my/${organization.slug}`,
        match: "exact",
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

