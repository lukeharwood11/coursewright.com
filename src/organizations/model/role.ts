export const ORG_ROLES = ["owner", "admin", "instructor", "parent"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const STAFF_INVITE_ROLES = ["owner", "admin", "instructor"] as const;
export type StaffInviteRole = (typeof STAFF_INVITE_ROLES)[number];

/**
 * Existing memberships that owners/admins may edit or remove.
 * Owner rows stay badge-only (invite or promote someone else to owner).
 */
export const EDITABLE_STAFF_ROLES = ["admin", "instructor"] as const;
export type EditableStaffRole = (typeof EDITABLE_STAFF_ROLES)[number];

/** @deprecated Prefer EDITABLE_STAFF_ROLES. */
export const CHANGEABLE_STAFF_ROLES = EDITABLE_STAFF_ROLES;
export type ChangeableStaffRole = EditableStaffRole;

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

/** Owners and admins invite collaborators. Instructors cannot. */
export function canInviteStaff(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

/** Owners and admins change roles and remove staff. Same gate as invites. */
export function canManageStaff(role: OrgRole): boolean {
  return canInviteStaff(role);
}

/** Owners, admins, and instructors invite parents. */
export function canInviteParent(role: OrgRole): boolean {
  return isStaffRole(role);
}

export function parseStaffInviteRole(value: string): StaffInviteRole | null {
  if (value === "owner" || value === "admin" || value === "instructor") {
    return value;
  }
  return null;
}

export function parseEditableStaffRole(value: string): EditableStaffRole | null {
  if (value === "admin" || value === "instructor") return value;
  return null;
}

/** @deprecated Prefer parseEditableStaffRole / parseStaffInviteRole. */
export function parseChangeableStaffRole(value: string): EditableStaffRole | null {
  return parseEditableStaffRole(value);
}

/** Admins may invite admin or instructor. Only owners may invite an owner.
 * Instructor first so the invite default stays the lowest privilege. */
export function inviteableStaffRoles(actor: OrgRole): StaffInviteRole[] {
  if (actor === "owner") return ["instructor", "admin", "owner"];
  if (actor === "admin") return ["instructor", "admin"];
  return [];
}

/**
 * Roles an actor may assign when changing an existing collaborator.
 * Owners can promote to owner; admins cannot.
 */
export function assignableStaffRoles(actor: OrgRole): StaffInviteRole[] {
  return inviteableStaffRoles(actor);
}

/** @deprecated Prefer assignableStaffRoles. */
export function changeableStaffRoles(actor: OrgRole): StaffInviteRole[] {
  return assignableStaffRoles(actor);
}

export function isStaffInviteRole(role: OrgRole): role is StaffInviteRole {
  return role === "owner" || role === "admin" || role === "instructor";
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
