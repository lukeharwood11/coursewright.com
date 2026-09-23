export const ORG_ROLES = ["owner", "admin", "instructor", "parent", "student"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const STAFF_INVITE_ROLES = ["owner", "admin", "instructor"] as const;
export type StaffInviteRole = (typeof STAFF_INVITE_ROLES)[number];

/**
 * Existing memberships that owners/admins may edit or remove.
 * Owner rows stay badge-only (invite or promote someone else to owner).
 * Parent rows are editable so they can be promoted to staff without a new invite.
 */
export const EDITABLE_MEMBERSHIP_ROLES = ["admin", "instructor", "parent", "student"] as const;
export type EditableMembershipRole = (typeof EDITABLE_MEMBERSHIP_ROLES)[number];

/** @deprecated Prefer EDITABLE_MEMBERSHIP_ROLES. */
export const EDITABLE_STAFF_ROLES = ["admin", "instructor"] as const;
export type EditableStaffRole = (typeof EDITABLE_STAFF_ROLES)[number];

/** @deprecated Prefer EDITABLE_MEMBERSHIP_ROLES. */
export const CHANGEABLE_STAFF_ROLES = EDITABLE_STAFF_ROLES;
export type ChangeableStaffRole = EditableStaffRole;

/** Roles assignable on an existing membership (staff invite roles + family demotion). */
export type AssignableMembershipRole = StaffInviteRole | "parent" | "student";

export function parseOrgRole(value: string): OrgRole | null {
  if (
    value === "owner" ||
    value === "admin" ||
    value === "instructor" ||
    value === "parent" ||
    value === "student"
  ) {
    return value;
  }
  return null;
}

export function isStaffRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin" || role === "instructor";
}

/** Parent and student memberships use the student presentation. */
export function isFamilyViewerRole(role: OrgRole): boolean {
  return role === "parent" || role === "student";
}

/** Owners and admins can change org identity, permalink, profile, school days, and grade scheme. */
export function canManageOrgSettings(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

/** Billing is owner-only. Admins run the org; they do not manage payment. */
export function canManageBilling(role: OrgRole): boolean {
  return role === "owner";
}

/** White labelling is owner-only. Admins still edit the rest of org settings. */
export function canManageBranding(role: OrgRole): boolean {
  return role === "owner";
}

/** Feature customizations are owner-only. Admins see them read-only. */
export function canManageCustomizations(role: OrgRole): boolean {
  return role === "owner";
}

/**
 * Panel Save/Cancel on organization settings.
 * On Customizations, only owners see that pair — a read-only admin
 * would otherwise get a disabled Save with nothing on this panel to save.
 */
export function showOrgSettingsFormActions(role: OrgRole, tab: string): boolean {
  if (!canManageOrgSettings(role)) return false;
  if (tab === "customizations") return canManageCustomizations(role);
  return true;
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

export function parseAssignableMembershipRole(
  value: string,
): AssignableMembershipRole | null {
  if (value === "parent" || value === "student") return value;
  return parseStaffInviteRole(value);
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
 * Staff roles an actor may assign when changing an existing collaborator.
 * Owners can promote to owner; admins cannot. Parent is added separately when
 * the target has a linked student.
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
  if (role === "student") return "Student";
  return "Parent";
}

export function roleBadgeVariant(
  role: OrgRole,
): "green" | "slate" | "neutral" {
  if (role === "owner" || role === "admin") return "green";
  if (role === "instructor") return "slate";
  return "neutral";
}
