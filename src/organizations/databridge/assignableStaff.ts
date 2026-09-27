import { requireSupabase } from "./client";

const ASSIGNABLE_ROLES = ["owner", "admin", "instructor"] as const;

export type AssignableOrgPerson = {
  orgProfileId: number;
  userId: string | null;
  name: string;
  email: string;
  role: string;
  pending: boolean;
};

type ProfileRow = {
  id: number;
  user_id: string | null;
  name: string;
  email: string | null;
};

/**
 * Owners, admins, and instructors who can be placed on a course or class.
 * Includes people who have not claimed yet. Names and emails are the org
 * profile only.
 */
export async function listAssignableOrgStaff(
  organizationId: number,
): Promise<AssignableOrgPerson[]> {
  const db = requireSupabase();
  const [memberships, invites, profiles] = await Promise.all([
    db
      .from("memberships")
      .select("user_id, role")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .in("role", [...ASSIGNABLE_ROLES]),
    db
      .from("admin_invites")
      .select("role, org_profile_id")
      .eq("organization_id", organizationId)
      .is("accepted_at", null)
      .in("role", [...ASSIGNABLE_ROLES]),
    db
      .from("org_profiles")
      .select("id, user_id, name, email")
      .eq("organization_id", organizationId),
  ]);

  if (memberships.error) throw new Error(memberships.error.message);
  if (invites.error) throw new Error(invites.error.message);
  if (profiles.error) throw new Error(profiles.error.message);

  const byUserId = new Map<string, ProfileRow>();
  const byId = new Map<number, ProfileRow>();
  for (const row of profiles.data ?? []) {
    const name = row.name.trim();
    if (!name) continue;
    const profile = { ...row, name };
    byId.set(profile.id, profile);
    if (profile.user_id) byUserId.set(profile.user_id, profile);
  }

  const people = new Map<number, AssignableOrgPerson>();

  for (const row of memberships.data ?? []) {
    if (!row.user_id) continue;
    const profile = byUserId.get(row.user_id);
    if (!profile) continue;
    people.set(profile.id, {
      orgProfileId: profile.id,
      userId: profile.user_id,
      name: profile.name,
      email: profile.email ?? "",
      role: row.role,
      pending: false,
    });
  }

  for (const invite of invites.data ?? []) {
    if (invite.org_profile_id == null || people.has(invite.org_profile_id)) {
      continue;
    }
    const profile = byId.get(invite.org_profile_id);
    if (!profile) continue;
    people.set(profile.id, {
      orgProfileId: profile.id,
      userId: profile.user_id,
      name: profile.name,
      email: profile.email ?? "",
      role: invite.role,
      pending: true,
    });
  }

  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}
