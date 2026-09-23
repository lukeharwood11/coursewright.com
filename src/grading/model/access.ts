import { isStaffRole, type OrgRole } from "@/organizations/model/role";

/**
 * Tier 1 — View: see names, classes, and grades the viewer is allowed to open.
 * Tier 2 — View+Actions: bulk-add, grade overrides, and report cards.
 * Schema edits stay owners/admins only, even inside Tier 2.
 */
export type StudentsHubTier = "learner" | "view" | "actions";

export function studentsHubTier(
  role: OrgRole | null,
  parentPresentation: boolean,
): StudentsHubTier {
  if (!role) return "view";
  if (role === "student") return "learner";
  if (isStaffRole(role) && parentPresentation) return "learner";
  if (isStaffRole(role)) return "actions";
  return "view";
}

export function canEditGradingScale(role: OrgRole | null): boolean {
  return role === "owner" || role === "admin";
}
