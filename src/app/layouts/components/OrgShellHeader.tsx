import type { CSSProperties } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { AccountMenu } from "@/auth/components/AccountMenu";
import { ActivityMenu } from "@/notifications";
import { chromeAccentVars } from "@/organizations/model/brand";
import { roleBadgeVariant, roleLabel } from "@/organizations/model/role";
import { OrgSearchBar } from "@/search";
import { useAppShell } from "../OrgShellContext";
import { useSidebarStore } from "../stores/sidebar";
import { StaffViewToggle } from "./StaffViewToggle";

export function OrgShellHeader() {
  const {
    brandLabel,
    organization,
    profileName,
    profileEmail,
    role,
    showSearch,
    showStaffViewToggle,
    staffViewMode,
    setStaffViewMode,
    parentPresentation,
  } = useAppShell();
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  const chromeStyle = chromeAccentVars(organization?.accentColor) as CSSProperties | undefined;

  return (
    <header
      className="cw-org-chrome flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 md:px-6"
      style={chromeStyle}
    >
      <button
        type="button"
        className="shrink-0 rounded-[6px] p-1.5 text-[var(--ink-soft)] hover:bg-[var(--chrome-accent-tint)] hover:text-[var(--chrome-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--chrome-accent)] md:hidden"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <Bars3Icon className="h-6 w-6" aria-hidden />
      </button>
      <p className="min-w-0 shrink truncate text-[13px] font-bold text-[var(--ink)] md:hidden">
        {brandLabel}
      </p>
      {showSearch && organization ? (
        <div className="hidden min-w-0 flex-1 md:block">
          <OrgSearchBar
            organizationId={organization.id}
            orgSlug={organization.slug}
          />
        </div>
      ) : (
        <div className="hidden min-w-0 flex-1 md:block" />
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {showStaffViewToggle ? (
          <StaffViewToggle mode={staffViewMode} onChange={setStaffViewMode} />
        ) : null}
        <div className="flex shrink-0 items-center gap-1.5">
          <AccountMenu
            name={profileName}
            email={profileEmail}
            roleLabel={role ? roleLabel(role) : undefined}
            roleBadgeVariant={role ? roleBadgeVariant(role) : undefined}
            orgName={organization?.name}
            orgSlug={organization?.slug}
            showOrgSettings={Boolean(organization) && !parentPresentation}
          />
          <ActivityMenu />
        </div>
      </div>
    </header>
  );
}
