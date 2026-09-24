export const ORG_ROLES = [
  "owner",
  "admin",
  "instructor",
  "observer",
  "parent",
  "student",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** Lowest privilege first so the invite default is Observer. */
export const STAFF_INVITE_ROLES = ["observer", "instructor", "admin", "owner"] as const;
export type StaffInviteRole = (typeof STAFF_INVITE_ROLES)[number];

export const OBSERVER_VIEW_ONLY_LABEL = "Observer · View only";
export const OBSERVER_VIEW_ONLY_HINT = "Observers can view but not edit.";

/**
 * Existing memberships that owners/admins may edit from Collaborators.
 * Owner rows stay badge-only. Parent rows can gain an exclusive role.
 * Students are not in this list. Observers are staff collaborators.
 */
export const EDITABLE_MEMBERSHIP_ROLES = [
  "observer",
  "admin",
  "instructor",
  "parent",
] as const;
export type EditableMembershipRole = (typeof EDITABLE_MEMBERSHIP_ROLES)[number];

/** @deprecated Prefer EDITABLE_MEMBERSHIP_ROLES. */
export const EDITABLE_STAFF_ROLES = ["observer", "admin", "instructor"] as const;
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
    value === "observer" ||
    value === "parent" ||
    value === "student"
  ) {
    return value;
  }
  return null;
}

/** Writers: owner, admin, instructor. Observer is not a writer. */
export function isStaffRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin" || role === "instructor";
}

/** Staff chrome and org-wide read. Mirrors private.can_browse_as_staff. */
export function browsesAsStaff(role: OrgRole): boolean {
  return isStaffRole(role) || role === "observer";
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

/** Owners and admins invite collaborators. Instructors cannot. */
export function canInviteStaff(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

/** Owners and admins change roles and remove staff. Same gate as invites. */
export function canManageStaff(role: OrgRole): boolean {
  return canInviteStaff(role);
}

/** Owners, admins, and instructors invite parents. Observers cannot. */
export function canInviteParent(role: OrgRole): boolean {
  return isStaffRole(role);
}

export function parseStaffInviteRole(value: string): StaffInviteRole | null {
  if (
    value === "observer" ||
    value === "owner" ||
    value === "admin" ||
    value === "instructor"
  ) {
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
  if (value === "observer" || value === "admin" || value === "instructor") return value;
  return null;
}

/** @deprecated Prefer parseEditableStaffRole / parseStaffInviteRole. */
export function parseChangeableStaffRole(value: string): EditableStaffRole | null {
  return parseEditableStaffRole(value);
}

/** Admins may invite observer, instructor, or admin. Only owners may invite an owner.
 * Observer is first so the invite default stays the lowest privilege. */
export function inviteableStaffRoles(actor: OrgRole): StaffInviteRole[] {
  if (actor === "owner") return ["observer", "instructor", "admin", "owner"];
  if (actor === "admin") return ["observer", "instructor", "admin"];
  return [];
}

/**
 * Exclusive roles an actor may assign on an existing collaborator.
 * Parent and student are additive and are not chosen here.
 */
export function assignableStaffRoles(actor: OrgRole): StaffInviteRole[] {
  return inviteableStaffRoles(actor);
}

/** @deprecated Prefer assignableStaffRoles. */
export function changeableStaffRoles(actor: OrgRole): StaffInviteRole[] {
  return assignableStaffRoles(actor);
}

export function isStaffInviteRole(role: OrgRole): role is StaffInviteRole {
  return (
    role === "observer" ||
    role === "owner" ||
    role === "admin" ||
    role === "instructor"
  );
}

export function roleLabel(role: OrgRole): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "instructor") return "Instructor";
  if (role === "observer") return "Observer";
  if (role === "student") return "Student";
  return "Parent";
}

export function roleBadgeVariant(
  role: OrgRole,
): "green" | "slate" | "neutral" {
  if (role === "owner" || role === "admin") return "green";
  if (role === "instructor" || role === "observer") return "slate";
  return "neutral";
}
