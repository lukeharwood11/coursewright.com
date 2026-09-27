import {
  browsesAsStaff,
  inviteableStaffRoles,
  parseStaffInviteRole,
  roleLabel,
  type OrgRole,
  type StaffInviteRole,
} from "./role";

export const ALREADY_IN_ORGANIZATION_MESSAGE = "They’re already in this organization.";

export const STUDENT_NOT_A_COLLABORATOR_MESSAGE =
  "Students can’t be changed from the collaborators list.";

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
  name: string;
  email: string;
  role: string;
  actorRole: OrgRole;
}):
  | { ok: true; value: { name: string; email: string; role: StaffInviteRole } }
  | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Enter a name." };
  }

  const email = normalizeInviteEmail(input.email);
  if (!isValidInviteEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const role = parseStaffInviteRole(input.role);
  if (!role) {
    return { ok: false, error: "Choose observer, instructor, admin, or owner." };
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

  return { ok: true, value: { name, email, role } };
}

/**
 * Add collaborator when that email already belongs to an org person.
 * A claimed parent gains the staff role on the same membership. A student
 * or an existing staff member is rejected. Parent and student names stay.
 */
export function staffAddForExistingPerson(input: {
  hasAccount: boolean;
  countsAsStudent: boolean;
  linkedAsParent: boolean;
  membershipRole: OrgRole | null;
}):
  | { action: "create-invite"; keepName: boolean }
  | { action: "stack-role" }
  | { action: "reject"; message: string } {
  const keepName = input.countsAsStudent || input.linkedAsParent;

  if (input.hasAccount && input.membershipRole && browsesAsStaff(input.membershipRole)) {
    return { action: "reject", message: ALREADY_IN_ORGANIZATION_MESSAGE };
  }
  if (input.hasAccount && input.membershipRole === "student") {
    return { action: "reject", message: STUDENT_NOT_A_COLLABORATOR_MESSAGE };
  }
  if (input.hasAccount && input.membershipRole === "parent") {
    return { action: "stack-role" };
  }
  return { action: "create-invite", keepName };
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

export function inviteCreatedMessage(input: {
  recipientEmail: string;
  emailSent: boolean;
  linkCopied: boolean;
  attached?: boolean;
  linked?: boolean;
  linkedParentName?: string;
  addedWithoutInviteEmail?: boolean;
}): string {
  if (input.linked) {
    const name = input.linkedParentName?.trim() || input.recipientEmail;
    return `Linked ${name} as parent`;
  }
  if (input.attached) {
    return "Already invited — this student was added to the existing invite.";
  }
  if (input.addedWithoutInviteEmail) {
    return "Added. Send an invite when you’re ready.";
  }
  if (input.emailSent) {
    return "Email invite sent!";
  }
  if (input.linkCopied) {
    return "Invite created, but the email didn’t send. Link copied — send it yourself.";
  }
  return "Invite created, but the email didn’t send. Copy the link and send it yourself.";
}

export function staffPrivilegeStackedMessage(input: {
  name: string;
  role: StaffInviteRole;
  stayedParent: boolean;
  stayedStudent: boolean;
}): string {
  const who = input.name.trim() || "They";
  const kept = [
    input.stayedParent ? "parent" : null,
    input.stayedStudent ? "student" : null,
  ].filter((label): label is string => Boolean(label));
  const keptNote = kept.length > 0 ? ` They stay a ${kept.join(" and ")}.` : "";
  return `Changed ${who} to ${roleLabel(input.role).toLowerCase()}.${keptNote}`;
}

export function inviteEmailResultMessage(input: {
  recipientEmail: string;
  emailSent: boolean;
  emailError: string | null;
}): string {
  if (input.emailSent) {
    return "Email invite sent!";
  }
  return input.emailError || "Couldn’t send the invite email. Copy the link and send it yourself.";
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

const MEMBER_ROLE_ORDER: Record<OrgRole, number> = {
  owner: 0,
  admin: 1,
  instructor: 2,
  observer: 3,
  parent: 4,
  student: 5,
};

export function compareStaffRole(a: OrgRole, b: OrgRole): number {
  return MEMBER_ROLE_ORDER[a] - MEMBER_ROLE_ORDER[b];
}
