import {
  inviteableStaffRoles,
  parseStaffInviteRole,
  type OrgRole,
  type StaffInviteRole,
} from "./role";

export function normalizeInviteEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidInviteEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeInviteEmail(value));
}

export function invitePath(token: string): string {
  return `/invite/${token}`;
}

export function inviteUrl(origin: string, token: string): string {
  return `${origin}${invitePath(token)}`;
}

export function staffInvitePath(token: string): string {
  return invitePath(token);
}

export function staffInviteUrl(origin: string, token: string): string {
  return inviteUrl(origin, token);
}

export function validateCreateStaffInvite(input: {
  email: string;
  role: string;
  actorRole: OrgRole;
}):
  | { ok: true; value: { email: string; role: StaffInviteRole } }
  | { ok: false; error: string } {
  const email = normalizeInviteEmail(input.email);
  if (!isValidInviteEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const role = parseStaffInviteRole(input.role);
  if (!role) {
    return { ok: false, error: "Choose owner, admin, or instructor." };
  }

  if (!inviteableStaffRoles(input.actorRole).includes(role)) {
    return {
      ok: false,
      error:
        role === "owner"
          ? "Only an owner can invite another owner."
          : "You don’t have permission to invite that role.",
    };
  }

  return { ok: true, value: { email, role } };
}

export function validateCreateParentInvite(input: {
  email: string;
}):
  | { ok: true; value: { email: string } }
  | { ok: false; error: string } {
  const email = normalizeInviteEmail(input.email);
  if (!isValidInviteEmail(email)) {
    return { ok: false, error: "Enter a valid parent email first." };
  }
  return { ok: true, value: { email } };
}

export function inviteWriteErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") {
    return "That email already has a pending invite.";
  }
  if (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security")
  ) {
    return "You don’t have permission to create that invite.";
  }
  return error.message;
}

export function staffInviteWriteErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  return inviteWriteErrorMessage(error);
}

const STAFF_ROLE_ORDER: Record<StaffInviteRole, number> = {
  owner: 0,
  admin: 1,
  instructor: 2,
};

export function compareStaffRole(a: StaffInviteRole, b: StaffInviteRole): number {
  return STAFF_ROLE_ORDER[a] - STAFF_ROLE_ORDER[b];
}
