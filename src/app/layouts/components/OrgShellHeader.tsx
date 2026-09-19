import { Bars3Icon } from "@heroicons/react/24/outline";
import { AccountMenu } from "@/auth/components/AccountMenu";
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

  return (
    <header className="cw-org-chrome flex flex-wrap items-center gap-3 border-b border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 md:px-6">
      <button
        type="button"
        className="shrink-0 rounded-[6px] p-1.5 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)] md:hidden"
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
        <div className="min-w-0 flex-1">
          <OrgSearchBar
            organizationId={organization.id}
            orgSlug={organization.slug}
          />
        </div>
      ) : (
        <div className="hidden min-w-0 flex-1 md:block" />
      )}
      {showStaffViewToggle ? (
        <StaffViewToggle mode={staffViewMode} onChange={setStaffViewMode} />
      ) : null}
      <AccountMenu
        name={profileName}
        email={profileEmail}
        roleLabel={role ? roleLabel(role) : undefined}
        roleBadgeVariant={role ? roleBadgeVariant(role) : undefined}
        orgName={organization?.name}
        orgSlug={organization?.slug}
        showOrgSettings={Boolean(organization) && !parentPresentation}
      />
    </header>
  );
}
