import {
  canManageStaff,
  assignableStaffRoles,
  parseAssignableMembershipRole,
  type AssignableMembershipRole,
  type EditableMembershipRole,
  type EditableStaffRole,
  type OrgRole,
} from "./role";

export const LAST_OWNER_ADMIN_MESSAGE =
  "This organization needs at least one owner or admin. You can’t remove or demote the last one.";

export const PARENT_ROLE_NEEDS_STUDENT_MESSAGE =
  "That person can only become a parent if they are linked to a student in this organization.";

export const STUDENT_ROLE_NEEDS_ACCOUNT_MESSAGE =
  "That person can only become a student if their account is linked to a student profile in this organization.";

export const REMOVE_LINKED_PARENT_MESSAGE =
  "This person is linked to a student. Change their role to Parent instead of removing them.";

export const REMOVE_LINKED_STUDENT_MESSAGE =
  "This person is linked to a student profile. Change their role to Student instead of removing them.";

export function isOrgManagerRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

export function isEditableMembershipRole(
  role: OrgRole,
): role is EditableMembershipRole {
  return (
    role === "admin" ||
    role === "instructor" ||
    role === "parent" ||
    role === "student"
  );
}

export function isEditableStaffRole(
  role: OrgRole,
): role is EditableStaffRole {
  return role === "admin" || role === "instructor";
}

/** @deprecated Prefer isEditableStaffRole. */
export function isChangeableStaffRole(
  role: OrgRole,
): role is EditableStaffRole {
  return isEditableStaffRole(role);
}

export function isLastOrgManager(
  members: readonly { membershipId: number; role: OrgRole }[],
  membershipId: number,
): boolean {
  const member = members.find((row) => row.membershipId === membershipId);
  if (!member || !isOrgManagerRole(member.role)) return false;
  return members.filter((row) => isOrgManagerRole(row.role)).length <= 1;
}

export function assignableMembershipRoles(input: {
  actorRole: OrgRole;
  currentRole: OrgRole;
  hasLinkedStudent: boolean;
  hasStudentAccount?: boolean;
}): AssignableMembershipRole[] {
  const staffRoles = assignableStaffRoles(input.actorRole);
  if (input.currentRole === "parent" || input.currentRole === "student") {
    return staffRoles;
  }
  if (!isEditableStaffRole(input.currentRole)) return staffRoles;
  const family: AssignableMembershipRole[] = [];
  if (input.hasLinkedStudent) family.push("parent");
  if (input.hasStudentAccount) family.push("student");
  return [...staffRoles, ...family];
}

export function staffMemberActions(input: {
  actorRole: OrgRole | null;
  member: {
    membershipId: number;
    role: OrgRole;
    hasLinkedStudent: boolean;
    hasStudentAccount?: boolean;
  };
  members: readonly { membershipId: number; role: OrgRole }[];
}): {
  canChangeRole: boolean;
  canRemove: boolean;
  changeRoles: AssignableMembershipRole[];
  lastManagerGuard: boolean;
} {
  const lastManagerGuard = isLastOrgManager(
    input.members,
    input.member.membershipId,
  );
  const changeRoles = input.actorRole
    ? assignableMembershipRoles({
        actorRole: input.actorRole,
        currentRole: input.member.role,
        hasLinkedStudent: input.member.hasLinkedStudent,
        hasStudentAccount: input.member.hasStudentAccount,
      })
    : [];

  if (!input.actorRole || !canManageStaff(input.actorRole)) {
    return {
      canChangeRole: false,
      canRemove: false,
      changeRoles: [],
      lastManagerGuard,
    };
  }

  const editableTarget = isEditableMembershipRole(input.member.role);
  const wouldDemoteLastManager =
    lastManagerGuard && isOrgManagerRole(input.member.role);

  const rolesForSelect: AssignableMembershipRole[] =
    editableTarget && changeRoles.length > 0
      ? ([
          input.member.role,
          ...changeRoles.filter((role) => role !== input.member.role),
        ] as AssignableMembershipRole[])
      : changeRoles;

  return {
    canChangeRole: editableTarget && changeRoles.length > 0 && !wouldDemoteLastManager,
    canRemove:
      isEditableStaffRole(input.member.role) &&
      !input.member.hasLinkedStudent &&
      !input.member.hasStudentAccount &&
      !wouldDemoteLastManager,
    changeRoles: rolesForSelect,
    lastManagerGuard,
  };
}

export function validateChangeStaffRole(input: {
  actorRole: OrgRole;
  currentRole: OrgRole;
  nextRole: string;
  isLastManager: boolean;
  hasLinkedStudent: boolean;
  hasStudentAccount?: boolean;
}):
  | { ok: true; value: AssignableMembershipRole }
  | { ok: false; error: string } {
  if (!canManageStaff(input.actorRole)) {
    return { ok: false, error: "You don’t have permission to change collaborator roles." };
  }

  if (!isEditableMembershipRole(input.currentRole)) {
    return { ok: false, error: "Owner roles can’t be changed here." };
  }

  const nextRole = parseAssignableMembershipRole(input.nextRole);
  if (!nextRole) {
    return { ok: false, error: "Choose instructor, admin, owner, parent, or student." };
  }

  const allowed = assignableMembershipRoles({
    actorRole: input.actorRole,
    currentRole: input.currentRole,
    hasLinkedStudent: input.hasLinkedStudent,
    hasStudentAccount: input.hasStudentAccount,
  });
  if (!allowed.includes(nextRole)) {
    if (nextRole === "parent") {
      return { ok: false, error: PARENT_ROLE_NEEDS_STUDENT_MESSAGE };
    }
    if (nextRole === "student") {
      return { ok: false, error: STUDENT_ROLE_NEEDS_ACCOUNT_MESSAGE };
    }
    return {
      ok: false,
      error:
        nextRole === "owner"
          ? "Only an owner can make someone an owner."
          : "You don’t have permission to assign that role.",
    };
  }

  if (
    input.isLastManager &&
    isOrgManagerRole(input.currentRole) &&
    !isOrgManagerRole(nextRole)
  ) {
    return { ok: false, error: LAST_OWNER_ADMIN_MESSAGE };
  }

  return { ok: true, value: nextRole };
}

export function validateRemoveStaffMember(input: {
  actorRole: OrgRole;
  targetRole: OrgRole;
  isLastManager: boolean;
  hasLinkedStudent: boolean;
  hasStudentAccount?: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (!canManageStaff(input.actorRole)) {
    return { ok: false, error: "You don’t have permission to remove collaborators." };
  }

  if (!isEditableStaffRole(input.targetRole)) {
    return { ok: false, error: "Owners can’t be removed here." };
  }

  if (input.hasLinkedStudent) {
    return { ok: false, error: REMOVE_LINKED_PARENT_MESSAGE };
  }

  if (input.hasStudentAccount) {
    return { ok: false, error: REMOVE_LINKED_STUDENT_MESSAGE };
  }

  if (input.isLastManager && isOrgManagerRole(input.targetRole)) {
    return { ok: false, error: LAST_OWNER_ADMIN_MESSAGE };
  }

  return { ok: true };
}

export function staffMembershipWriteErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  const message = error.message.toLowerCase();
  if (message.includes("cannot remove or demote the last remaining owner or admin")) {
    return LAST_OWNER_ADMIN_MESSAGE;
  }
  if (
    message.includes("can only become a parent if they are linked to a student")
  ) {
    return PARENT_ROLE_NEEDS_STUDENT_MESSAGE;
  }
  if (
    message.includes("can only become a student if their account is linked")
  ) {
    return STUDENT_ROLE_NEEDS_ACCOUNT_MESSAGE;
  }
  if (
    error.code === "42501" ||
    message.includes("row-level security")
  ) {
    return "You don’t have permission to update that collaborator.";
  }
  return error.message;
}
