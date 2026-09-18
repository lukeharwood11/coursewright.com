import {
  canManageStaff,
  changeableStaffRoles,
  parseChangeableStaffRole,
  type ChangeableStaffRole,
  type OrgRole,
  type StaffInviteRole,
} from "./role";

export const LAST_OWNER_ADMIN_MESSAGE =
  "This organization needs at least one owner or admin. You can’t remove or demote the last one.";

export function isOrgManagerRole(role: StaffInviteRole): boolean {
  return role === "owner" || role === "admin";
}

export function isChangeableStaffRole(
  role: StaffInviteRole,
): role is ChangeableStaffRole {
  return role === "admin" || role === "instructor";
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
  changeRoles: ChangeableStaffRole[];
  lastManagerGuard: boolean;
} {
  const lastManagerGuard = isLastOrgManager(
    input.members,
    input.member.membershipId,
  );
  const changeRoles = input.actorRole ? changeableStaffRoles(input.actorRole) : [];

  if (!input.actorRole || !canManageStaff(input.actorRole)) {
    return {
      canChangeRole: false,
      canRemove: false,
      changeRoles: [],
      lastManagerGuard,
    };
  }

  const changeableTarget = isChangeableStaffRole(input.member.role);
  const wouldDemoteLastManager =
    lastManagerGuard && isOrgManagerRole(input.member.role);

  return {
    canChangeRole: changeableTarget && changeRoles.length > 0 && !wouldDemoteLastManager,
    canRemove: changeableTarget && !wouldDemoteLastManager,
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
  | { ok: true; value: ChangeableStaffRole }
  | { ok: false; error: string } {
  if (!canManageStaff(input.actorRole)) {
    return { ok: false, error: "You don’t have permission to change staff roles." };
  }

  if (!isChangeableStaffRole(input.currentRole)) {
    return { ok: false, error: "Owner roles can’t be changed here." };
  }

  const nextRole = parseChangeableStaffRole(input.nextRole);
  if (!nextRole) {
    return { ok: false, error: "Choose admin or instructor." };
  }

  if (!changeableStaffRoles(input.actorRole).includes(nextRole)) {
    return { ok: false, error: "You don’t have permission to assign that role." };
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
    return { ok: false, error: "You don’t have permission to remove staff." };
  }

  if (!isChangeableStaffRole(input.targetRole)) {
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
    return "You don’t have permission to update that staff member.";
  }
  return error.message;
}
