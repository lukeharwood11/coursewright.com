import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Mark, WordmarkText } from "@/ui/Wordmark";
import { useAppShell } from "../OrgShellContext";
import { useSidebarStore } from "../stores/sidebar";
import { SidebarNav } from "./SidebarNav";

export function OrgSidebar() {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  return (
    <>
      <aside
        className={`cw-org-chrome hidden h-screen shrink-0 border-r border-[var(--line-soft)] bg-[var(--surface)] md:sticky md:top-0 md:block motion-reduce:transition-none ${
          collapsed ? "w-[4.25rem]" : "w-[16.5rem]"
        } transition-[width] duration-200`}
      >
        <SidebarPanel
          collapsed={collapsed}
          onCollapseToggle={toggleCollapsed}
        />
      </aside>

      {mobileOpen ? (
        <div className="cw-org-chrome fixed inset-0 z-30 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--ink)]/30"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[16.5rem] max-w-[85vw] border-r border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)]">
            <SidebarPanel
              collapsed={false}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarPanel({
  collapsed,
  onClose,
  onCollapseToggle,
}: {
  collapsed: boolean;
  onClose?: () => void;
  onCollapseToggle?: () => void;
}) {
  const { brandLabel, brandHref, organization } = useAppShell();

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center gap-2.5 border-b border-[var(--line-soft)] px-3 py-3 ${
          collapsed ? "justify-center md:px-2" : ""
        }`}
      >
        <Link
          to={brandHref}
          className="flex min-w-0 items-center gap-2.5 rounded-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
          onClick={onClose}
        >
          <Mark px={28} />
          {collapsed ? (
            <span className="sr-only">{brandLabel}</span>
          ) : organization ? (
            <span className="min-w-0 truncate text-[13px] font-bold text-[var(--ink)]">
              {brandLabel}
            </span>
          ) : (
            <span
              className="min-w-0 truncate text-[19px] font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <WordmarkText />
            </span>
          )}
        </Link>
        {onClose ? (
          <button
            type="button"
            className="ml-auto rounded-[6px] p-1.5 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} onNavigate={() => onClose?.()} />
      </div>

      {onCollapseToggle ? (
        <div className="border-t border-[var(--line-soft)] p-2">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] font-bold text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
            onClick={onCollapseToggle}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden />
                Collapse
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
