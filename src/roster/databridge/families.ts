import { requireSupabase } from "./client";

export type FamilySummary = {
  id: string;
  organizationId: string;
  displayName: string | null;
};

export const familyQueryKeys = {
  list: (orgId: string) => ["families", "list", orgId] as const,
  detail: (id: string) => ["families", "detail", id] as const,
};

export async function listFamilies(
  organizationId: string,
): Promise<FamilySummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("families")
    .select("id, organization_id, display_name")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("display_name");

  if (error) throw new Error(error.message);
  return (data ?? []).map(toFamilySummary);
}

export async function getFamily(id: string): Promise<FamilySummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("families")
    .select("id, organization_id, display_name")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toFamilySummary(data);
}

function toFamilySummary(row: {
  id: string;
  organization_id: string;
  display_name: string | null;
}): FamilySummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
  };
}
