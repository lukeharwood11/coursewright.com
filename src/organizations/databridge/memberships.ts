import type { OrgRole } from "@/organizations/model/role";
import { parseOrgRole } from "@/organizations/model/role";
import { requireSupabase } from "./client";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

export type OrgMembership = {
  membershipId: string;
  role: OrgRole;
  organization: OrganizationSummary;
};

type MembershipRow = {
  id: string;
  role: string;
  organization:
    | OrganizationSummary
    | OrganizationSummary[]
    | null;
};

function unwrapOrg(
  value: MembershipRow["organization"],
): OrganizationSummary | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toMembership(row: MembershipRow): OrgMembership | null {
  const role = parseOrgRole(row.role);
  const organization = unwrapOrg(row.organization);
  if (!role || !organization) return null;
  return {
    membershipId: row.id,
    role,
    organization,
  };
}

export const orgQueryKeys = {
  memberships: (userId: string) => ["organizations", "memberships", userId] as const,
  bySlug: (slug: string, userId: string) =>
    ["organizations", "slug", slug, userId] as const,
  detail: (id: string) => ["organizations", "detail", id] as const,
};

export async function listMyMemberships(userId: string): Promise<OrgMembership[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("id, role, organization:organizations(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => toMembership(row as MembershipRow))
    .filter((row): row is OrgMembership => row !== null);
}

export async function getMembershipByOrgSlug(
  userId: string,
  slug: string,
): Promise<OrgMembership | null> {
  const db = requireSupabase();
  const { data: org, error: orgError } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);
  if (!org) return null;

  const { data: membership, error: membershipError } = await db
    .from("memberships")
    .select("id, role")
    .eq("user_id", userId)
    .eq("organization_id", org.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (!membership) return null;

  const role = parseOrgRole(membership.role);
  if (!role) return null;

  return {
    membershipId: membership.id,
    role,
    organization: { id: org.id, name: org.name, slug: org.slug },
  };
}
