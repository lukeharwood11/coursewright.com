import {
  canManageStaff,
  assignableStaffRoles,
  parseStaffInviteRole,
  type EditableStaffRole,
  type OrgRole,
  type StaffInviteRole,
} from "./role";

export const LAST_OWNER_ADMIN_MESSAGE =
  "This organization needs at least one owner or admin. You can’t remove or demote the last one.";

export function isOrgManagerRole(role: StaffInviteRole): boolean {
  return role === "owner" || role === "admin";
}

export function isEditableStaffRole(
  role: StaffInviteRole,
): role is EditableStaffRole {
  return role === "admin" || role === "instructor";
}

/** @deprecated Prefer isEditableStaffRole. */
export function isChangeableStaffRole(
  role: StaffInviteRole,
): role is EditableStaffRole {
  return isEditableStaffRole(role);
}

export function isLastOrgManager(
  members: readonly { membershipId: number; role: StaffInviteRole }[],
  membershipId: number,
): boolean {
  const member = members.find((row) => row.membershipId === membershipId);
  if (!member || !isOrgManagerRole(member.role)) return false;
  return members.filter((row) => isOrgManagerRole(row.role)).length <= 1;
}

export function staffMemberActions(input: {
  actorRole: OrgRole | null;
  member: { membershipId: number; role: StaffInviteRole };
  members: readonly { membershipId: number; role: StaffInviteRole }[];
}): {
  canChangeRole: boolean;
  canRemove: boolean;
  changeRoles: StaffInviteRole[];
  lastManagerGuard: boolean;
} {
  const lastManagerGuard = isLastOrgManager(
    input.members,
    input.member.membershipId,
  );
  const changeRoles = input.actorRole ? assignableStaffRoles(input.actorRole) : [];

  if (!input.actorRole || !canManageStaff(input.actorRole)) {
    return {
      canChangeRole: false,
      canRemove: false,
      changeRoles: [],
      lastManagerGuard,
    };
  }

  const editableTarget = isEditableStaffRole(input.member.role);
  const wouldDemoteLastManager =
    lastManagerGuard && isOrgManagerRole(input.member.role);

  return {
    canChangeRole: editableTarget && changeRoles.length > 0 && !wouldDemoteLastManager,
    canRemove: editableTarget && !wouldDemoteLastManager,
    changeRoles,
    lastManagerGuard,
  };
}

export function validateChangeStaffRole(input: {
  actorRole: OrgRole;
  currentRole: StaffInviteRole;
  nextRole: string;
  isLastManager: boolean;
}):
  | { ok: true; value: StaffInviteRole }
  | { ok: false; error: string } {
  if (!canManageStaff(input.actorRole)) {
    return { ok: false, error: "You don’t have permission to change collaborator roles." };
  }

  if (!isEditableStaffRole(input.currentRole)) {
    return { ok: false, error: "Owner roles can’t be changed here." };
  }

  const nextRole = parseStaffInviteRole(input.nextRole);
  if (!nextRole) {
    return { ok: false, error: "Choose instructor, admin, or owner." };
  }

  if (!assignableStaffRoles(input.actorRole).includes(nextRole)) {
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
  targetRole: StaffInviteRole;
  isLastManager: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (!canManageStaff(input.actorRole)) {
    return { ok: false, error: "You don’t have permission to remove collaborators." };
  }

  if (!isEditableStaffRole(input.targetRole)) {
    return { ok: false, error: "Owners can’t be removed here." };
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
    error.code === "42501" ||
    message.includes("row-level security")
  ) {
    return "You don’t have permission to update that collaborator.";
  }
  return error.message;
}
