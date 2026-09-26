import { browsesAsStaff, canManageStaff, type OrgRole } from "./role";
import { isValidInviteEmail, normalizeInviteEmail } from "./staffInvite";

export function canEditOrgPersonName(input: {
  actorRole: OrgRole | null;
  isSelf: boolean;
  hasOrgProfile: boolean;
}): boolean {
  if (!input.hasOrgProfile || !input.actorRole) return false;
  if (canManageStaff(input.actorRole)) return true;
  return input.isSelf && browsesAsStaff(input.actorRole);
}

export function canEditOrgPersonEmail(input: {
  actorRole: OrgRole | null;
  hasOrgProfile: boolean;
}): boolean {
  if (!input.hasOrgProfile || !input.actorRole) return false;
  return canManageStaff(input.actorRole);
}

export function isOrgPersonAccountLinked(
  userId: string | null | undefined,
): boolean {
  return Boolean(userId);
}

function normalizeOrgPersonEmailForCompare(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "";
  return normalizeInviteEmail(trimmed);
}

/** True when staff are editing contact email on a person who already claimed an account. */
export function isChangingLinkedOrgPersonContactEmail(input: {
  accountLinked: boolean;
  canEditEmail: boolean;
  email: string;
  savedEmail: string;
}): boolean {
  if (!input.accountLinked || !input.canEditEmail) return false;
  return (
    normalizeOrgPersonEmailForCompare(input.email) !==
    normalizeOrgPersonEmailForCompare(input.savedEmail)
  );
}

export function validateOrgPersonName(value: string):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const name = value.trim();
  if (!name) return { ok: false, error: "Enter a name." };
  return { ok: true, value: name };
}

export function validateOrgPersonContact(input: {
  name: string;
  email?: string;
  includeEmail: boolean;
}):
  | { ok: true; value: { name: string; email?: string } }
  | { ok: false; error: string } {
  const name = validateOrgPersonName(input.name);
  if (!name.ok) return name;

  if (!input.includeEmail) {
    return { ok: true, value: { name: name.value } };
  }

  const email = normalizeInviteEmail(input.email ?? "");
  if (!email) {
    return { ok: true, value: { name: name.value, email: "" } };
  }
  if (!isValidInviteEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return { ok: true, value: { name: name.value, email } };
}
