import { requireSupabase } from "./client";

export type OrgContact = {
  id: number;
  name: string;
  email: string | null;
};

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
    .select("id, user_id, name, email")
    .eq("organization_id", organizationId)
    .in("user_id", ids);
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const name = row.name?.trim();
    if (!row.user_id || !name) continue;
    contacts.set(row.user_id, { id: row.id, name, email: row.email });
  }
  return contacts;
}
