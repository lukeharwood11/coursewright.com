import type { ComponentType, SVGProps } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BellAlertIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  InboxIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  BellAlertIcon as BellAlertSolidIcon,
  BookOpenIcon as BookOpenSolidIcon,
  BuildingOffice2Icon as BuildingOffice2SolidIcon,
  CalendarDaysIcon as CalendarDaysSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  HomeIcon as HomeSolidIcon,
  InboxIcon as InboxSolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
  UsersIcon as UsersSolidIcon,
} from "@heroicons/react/24/solid";
import { toastNotImplemented } from "@/ui/toast";
import { useAppShell } from "../OrgShellContext";
import {
  collapsedHref,
  navItemIsActive,
  type NavSection,
} from "../model/nav";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const sectionIcons: Record<string, { outline: IconComponent; solid: IconComponent }> = {
  organizations: { outline: BuildingOffice2Icon, solid: BuildingOffice2SolidIcon },
  account: { outline: UserCircleIcon, solid: UserCircleSolidIcon },
  home: { outline: HomeIcon, solid: HomeSolidIcon },
  announcements: { outline: BellAlertIcon, solid: BellAlertSolidIcon },
  discussions: { outline: ChatBubbleLeftRightIcon, solid: ChatBubbleLeftRightSolidIcon },
  activity: { outline: InboxIcon, solid: InboxSolidIcon },
  calendar: { outline: CalendarDaysIcon, solid: CalendarDaysSolidIcon },
  courses: { outline: BookOpenIcon, solid: BookOpenSolidIcon },
  roster: { outline: UsersIcon, solid: UsersSolidIcon },
  settings: { outline: Cog6ToothIcon, solid: Cog6ToothSolidIcon },
  progress: { outline: ChartBarIcon, solid: ChartBarSolidIcon },
};

const itemClass =
  "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]";

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { navSections, navLabel } = useAppShell();
  const { pathname } = useLocation();

  return (
    <nav aria-label={navLabel} className="flex flex-col gap-1 px-2 py-3">
      {navSections.map((section) => (
        <SidebarSection
          key={section.id}
          section={section}
          collapsed={collapsed}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarSection({
  section,
  collapsed,
  pathname,
  onNavigate,
}: {
  section: NavSection;
  collapsed: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const icons = sectionIcons[section.id] ?? sectionIcons.home;
  const sectionActive =
    navItemIsActive(pathname, section) ||
    section.children.some((child) => navItemIsActive(pathname, child)) ||
    (section.id === "roster" && /\/classes\//.test(pathname));
  const href = collapsed ? collapsedHref(section) : section.href;
  const showChildren = !collapsed && section.children.length > 0;
  const Icon = sectionActive ? icons.solid : icons.outline;

  return (
    <div>
      <SidebarRow
        label={section.label}
        href={href}
        soon={section.soon}
        active={sectionActive}
        collapsed={collapsed}
        icon={Icon}
        badgeCount={section.badgeCount}
        onNavigate={onNavigate}
      />
      {showChildren ? (
        <ul className="mb-1 ml-4 mt-0.5 border-l border-[var(--line-soft)] pl-2">
          {section.children.map((child) => (
            <li key={child.id}>
              <NavLink
                to={child.href}
                title={child.label}
                onClick={onNavigate}
                className={`${itemClass} ${
                  navItemIsActive(pathname, child)
                    ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                }`}
              >
                <span className="truncate">{child.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NavBadge({
  count,
  collapsed,
}: {
  count: number;
  collapsed: boolean;
}) {
  const label = count > 99 ? "99+" : String(count);
  if (collapsed) {
    return (
      <span
        className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C44536] px-0.5 text-[9px] font-extrabold leading-none text-white"
        aria-hidden
      >
        {label}
      </span>
    );
  }
  return (
    <span className="ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#C44536] px-1.5 text-[11px] font-extrabold leading-none text-white">
      {label}
    </span>
  );
}

function SidebarRow({
  label,
  href,
  soon,
  active,
  collapsed,
  icon: Icon,
  badgeCount,
  onNavigate,
}: {
  label: string;
  href: string | null;
  soon?: boolean;
  active: boolean;
  collapsed: boolean;
  icon: IconComponent;
  badgeCount?: number;
  onNavigate: () => void;
}) {
  const showBadge = badgeCount != null && badgeCount > 0;
  const className = `${itemClass} ${collapsed ? "relative justify-center px-0" : ""} ${
    active
      ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
      : soon
        ? "text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
        : "text-[var(--ink)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
  }`;

  const title = showBadge
    ? `${label} (${badgeCount} unread)`
    : label;

  const content = (
    <>
      {collapsed ? (
        <span className="relative">
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {showBadge ? <NavBadge count={badgeCount} collapsed /> : null}
        </span>
      ) : (
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
      )}
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="truncate">{label}</span>
      )}
      {!collapsed && showBadge ? (
        <NavBadge count={badgeCount} collapsed={false} />
      ) : null}
      {showBadge ? (
        <span className="sr-only">{`${badgeCount} unread`}</span>
      ) : null}
    </>
  );

  if (soon) {
    return (
      <button
        type="button"
        title={title}
        className={className}
        onClick={() => toastNotImplemented(label)}
      >
        {content}
      </button>
    );
  }

  if (!href) {
    return (
      <h4
        title={title}
        className={`${itemClass} ${collapsed ? "justify-center px-0" : ""} cursor-default text-[12.5px] text-[var(--ink-soft)]`}
      >
        {content}
      </h4>
    );
  }

  return (
    <NavLink to={href} title={title} onClick={onNavigate} className={className}>
      {content}
    </NavLink>
  );
}
