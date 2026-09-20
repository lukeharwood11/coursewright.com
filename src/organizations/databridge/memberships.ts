import type { AssignableMembershipRole, OrgRole } from "@/organizations/model/role";
import { EDITABLE_MEMBERSHIP_ROLES, EDITABLE_STAFF_ROLES, parseOrgRole } from "@/organizations/model/role";
import { staffMembershipWriteErrorMessage } from "@/organizations/model/staffAccount";
import { requireSupabase } from "./client";

export type OrganizationSummary = {
  id: number;
  name: string;
  slug: string;
};

export type OrgMembership = {
  membershipId: number;
  role: OrgRole;
  organization: OrganizationSummary;
};

type MembershipRow = {
  id: number;
  role: string;
  organization: OrganizationSummary | OrganizationSummary[] | null;
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

export type OrgPerson = {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
};

export const orgQueryKeys = {
  memberships: (userId: string) => ["organizations", "memberships", userId] as const,
  bySlug: (slug: string, userId: string) =>
    ["organizations", "slug", slug, userId] as const,
  detail: (id: number) => ["organizations", "detail", id] as const,
  people: (orgId: number) => ["organizations", "people", orgId] as const,
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

export async function listOrgPeople(
  organizationId: number,
): Promise<OrgPerson[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("user_id, role, profile:profiles(name, email)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const role = parseOrgRole(row.role);
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!role || !profile || !row.user_id) return [];
    return [
      {
        userId: row.user_id,
        name: profile.name || profile.email,
        email: profile.email,
        role,
      },
    ];
  });
}

export async function updateStaffMembershipRole(input: {
  membershipId: number;
  role: AssignableMembershipRole;
}): Promise<void> {
  if (!Number.isFinite(input.membershipId)) {
    throw new Error("That staff member couldn’t be updated. Refresh and try again.");
  }
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .update({ role: input.role })
    .eq("id", input.membershipId)
    .eq("status", "active")
    .in("role", [...EDITABLE_MEMBERSHIP_ROLES])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to change that person’s role.");
  }
}

export async function removeStaffMembership(membershipId: number): Promise<void> {
  if (!Number.isFinite(membershipId)) {
    throw new Error("That staff member couldn’t be removed. Refresh and try again.");
  }
  const db = requireSupabase();
  // Memberships have no deleted_at. status=suspended would block a later invite
  // (unique org + user). Do not cascade into enrollments, parent links, or
  // materials RLS — those stay enrollment-gated.
  const { data, error } = await db
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .eq("status", "active")
    .in("role", [...EDITABLE_STAFF_ROLES])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to remove that person.");
  }
}
