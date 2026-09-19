import { createContext, useContext } from "react";
import type { OrganizationSummary } from "@/organizations/databridge/memberships";
import type { OrgRole } from "@/organizations/model/role";
import type { NavSection } from "./model/nav";
import type { StaffViewMode } from "./model/viewMode";

export type AppShellValue = {
  brandLabel: string;
  brandHref: string;
  navLabel: string;
  organization: OrganizationSummary | null;
  role: OrgRole | null;
  profileName: string;
  profileEmail: string;
  navSections: NavSection[];
  showSearch: boolean;
  parentPresentation: boolean;
  showStaffViewToggle: boolean;
  staffViewMode: StaffViewMode;
  setStaffViewMode: (mode: StaffViewMode) => void;
};

export const OrgShellContext = createContext<AppShellValue | null>(null);

export function useAppShell() {
  const value = useContext(OrgShellContext);
  if (!value) {
    throw new Error("useAppShell must be used within a shell layout");
  }
  return value;
}

export function useOrgShell() {
  const value = useAppShell();
  if (!value.organization || !value.role) {
    throw new Error("useOrgShell must be used within OrgLayout");
  }
  return {
    ...value,
    organization: value.organization,
    role: value.role,
  };
}
