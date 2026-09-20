import { requireSupabase } from "./client";
import { parseOrgRole, type OrgRole } from "@/organizations/model/role";

export type OrgPersonLink = {
  id: number;
  title: string;
};

export type OrgPersonProfile = {
  userId: string;
  name: string;
  role: OrgRole;
  teaches: OrgPersonLink[];
  leads: OrgPersonLink[];
  courses: OrgPersonLink[];
};

export const orgPersonQueryKeys = {
  profile: (orgId: number, userId: string) =>
    ["organizations", "person", orgId, userId] as const,
};

function asLinks(value: unknown): OrgPersonLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; title?: unknown };
    if (typeof row.id !== "number" || typeof row.title !== "string") return [];
    return [{ id: row.id, title: row.title }];
  });
}

export async function getOrgPersonProfile(
  organizationId: number,
  userId: string,
): Promise<OrgPersonProfile | null> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("get_org_person_profile", {
    p_organization_id: organizationId,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) return null;

  const role = parseOrgRole(row.role);
  if (!role) return null;

  return {
    userId: row.user_id,
    name: row.name,
    role,
    teaches: asLinks(row.teaches),
    leads: asLinks(row.leads),
    courses: asLinks(row.courses),
  };
}
