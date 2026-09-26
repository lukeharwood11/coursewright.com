import { requireSupabase } from "./client";

export type OrgContact = {
  id: number;
  name: string;
  email: string | null;
  userId: string | null;
};

const ORG_PERSON_COLUMNS = "id, user_id, name, email" as const;

function toOrgContact(row: {
  id: number;
  user_id: string | null;
  name: string;
  email: string | null;
}): OrgContact | null {
  const name = row.name.trim();
  if (!name) return null;
  return {
    id: row.id,
    name,
    email: row.email,
    userId: row.user_id,
  };
}

function orgPersonWriteError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "That email is already used in this organization.";
  }
  if (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security")
  ) {
    return "You don’t have permission to change that person.";
  }
  return error.message;
}

/** In-org name and contact email for claimed accounts. Account profile is not a fallback. */
export async function orgContactsByUserId(
  organizationId: number,
  userIds: Array<string | null | undefined>,
): Promise<Map<string, OrgContact>> {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  const contacts = new Map<string, OrgContact>();
  if (ids.length === 0) return contacts;

  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select(ORG_PERSON_COLUMNS)
    .eq("organization_id", organizationId)
    .in("user_id", ids);
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const contact = toOrgContact(row);
    if (!contact?.userId) continue;
    contacts.set(contact.userId, contact);
  }
  return contacts;
}

export async function getOrgProfile(
  organizationId: number,
  orgProfileId: number,
): Promise<OrgContact | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select(ORG_PERSON_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", orgProfileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toOrgContact(data);
}

export async function findOrgProfileByEmail(
  organizationId: number,
  email: string,
): Promise<OrgContact | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select(ORG_PERSON_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("email", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toOrgContact(data);
}

export async function createOrgPerson(input: {
  organizationId: number;
  name: string;
  email?: string | null;
}): Promise<OrgContact> {
  const name = input.name.trim();
  if (!name) throw new Error("Enter a name.");
  const email =
    input.email == null || input.email === ""
      ? null
      : input.email.trim().toLowerCase();

  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .insert({
      organization_id: input.organizationId,
      name,
      email,
      counts_as_student: false,
    })
    .select(ORG_PERSON_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(orgPersonWriteError(error));
  const created = data ? toOrgContact(data) : null;
  if (!created) throw new Error("You don’t have permission to add that person.");
  return created;
}

export async function updateOrgPersonContact(input: {
  orgProfileId: number;
  name: string;
  email?: string;
}): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Enter a name.");
  const patch: { name: string; email?: string | null } = { name };
  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    patch.email = email.length > 0 ? email : null;
  }
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .update(patch)
    .eq("id", input.orgProfileId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(orgPersonWriteError(error));
  if (!data) throw new Error("You don’t have permission to change that name.");
}
