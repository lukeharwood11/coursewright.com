import type { ComponentType, SVGProps } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BellAlertIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  FolderOpenIcon,
  HomeIcon,
  AcademicCapIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  BellAlertIcon as BellAlertSolidIcon,
  BookOpenIcon as BookOpenSolidIcon,
  BuildingOffice2Icon as BuildingOffice2SolidIcon,
  CalendarDaysIcon as CalendarDaysSolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  Cog6ToothIcon as Cog6ToothSolidIcon,
  FolderOpenIcon as FolderOpenSolidIcon,
  HomeIcon as HomeSolidIcon,
  AcademicCapIcon as AcademicCapSolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
  UsersIcon as UsersSolidIcon,
} from "@heroicons/react/24/solid";
import { toastNotImplemented } from "@/ui/toast";
import { useAppShell } from "../OrgShellContext";
import {
  collapsedHref,
  navItemIsActive,
  splitNavSections,
  type NavSection,
} from "../model/nav";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const sectionIcons: Record<string, { outline: IconComponent; solid: IconComponent }> = {
  organizations: { outline: BuildingOffice2Icon, solid: BuildingOffice2SolidIcon },
  account: { outline: UserCircleIcon, solid: UserCircleSolidIcon },
  home: { outline: HomeIcon, solid: HomeSolidIcon },
  announcements: { outline: BellAlertIcon, solid: BellAlertSolidIcon },
  discussions: { outline: ChatBubbleLeftRightIcon, solid: ChatBubbleLeftRightSolidIcon },
  calendar: { outline: CalendarDaysIcon, solid: CalendarDaysSolidIcon },
  courses: { outline: BookOpenIcon, solid: BookOpenSolidIcon },
  resources: { outline: FolderOpenIcon, solid: FolderOpenSolidIcon },
  students: { outline: UsersIcon, solid: UsersSolidIcon },
  progress: { outline: AcademicCapIcon, solid: AcademicCapSolidIcon },
  settings: { outline: Cog6ToothIcon, solid: Cog6ToothSolidIcon },
};

const itemClass =
  "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chrome-accent)]";

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { navSections, navLabel } = useAppShell();
  const { pathname } = useLocation();
  const { main, footer } = splitNavSections(navSections);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav
        aria-label={navLabel}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3"
      >
        {main.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            collapsed={collapsed}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      {footer.length > 0 ? (
        <>
          <div
            className="mx-3 border-t border-[var(--line-soft)]"
            role="separator"
            aria-hidden
          />
          <nav
            aria-label={`${navLabel} — more`}
            className="flex shrink-0 flex-col gap-1 px-2 py-3"
          >
            {footer.map((section) => (
              <SidebarSection
                key={section.id}
                section={section}
                collapsed={collapsed}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </>
      ) : null}
    </div>
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
    (section.id === "students" && /\/classes\//.test(pathname));
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
                    ? "bg-[var(--chrome-accent-tint)] text-[var(--chrome-accent-deep)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--chrome-accent-tint)] hover:text-[var(--chrome-accent-deep)]"
                }`}
              >
                {child.iconUrl ? (
                  <img
                    src={child.iconUrl}
                    alt=""
                    className="h-4 w-4 shrink-0 rounded-[4px] object-cover"
                  />
                ) : null}
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
      ? "bg-[var(--chrome-accent-tint)] text-[var(--chrome-accent-deep)]"
      : soon
        ? "text-[var(--ink-faint)] hover:bg-[var(--chrome-accent-tint)] hover:text-[var(--chrome-accent-deep)]"
        : "text-[var(--ink)] hover:bg-[var(--chrome-accent-tint)] hover:text-[var(--chrome-accent-deep)]"
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
