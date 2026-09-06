export const ORG_ROLES = ["owner", "admin", "instructor", "parent"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export function parseOrgRole(value: string): OrgRole | null {
  if (
    value === "owner" ||
    value === "admin" ||
    value === "instructor" ||
    value === "parent"
  ) {
    return value;
  }
  return null;
}

export function isStaffRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin" || role === "instructor";
}

/** Owners and admins can change org identity, permalink, and grade scheme. */
export function canManageOrgSettings(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

/** Billing is owner-only. Admins run the org; they do not manage payment. */
export function canManageBilling(role: OrgRole): boolean {
  return role === "owner";
}

export function roleLabel(role: OrgRole): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Instructor";
  return "Parent";
}

export function roleBadgeVariant(
  role: OrgRole,
): "green" | "slate" | "neutral" {
  if (role === "owner" || role === "admin") return "green";
  if (role === "instructor") return "slate";
  return "neutral";
}
