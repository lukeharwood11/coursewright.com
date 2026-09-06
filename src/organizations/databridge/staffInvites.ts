import type { StaffInviteRole } from "@/organizations/model/role";
import { parseStaffInviteRole } from "@/organizations/model/role";
import { staffInviteWriteErrorMessage } from "@/organizations/model/staffInvite";
import { requireSupabase } from "./client";
import type { OrganizationSummary } from "./memberships";

export type OrgStaffMember = {
  membershipId: string;
  role: StaffInviteRole;
  name: string;
  email: string;
};

export type PendingStaffInvite = {
  id: string;
  email: string;
  role: StaffInviteRole;
  token: string;
  createdAt: string;
  organization: OrganizationSummary;
};

export type StaffInvitePreview = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  email: string;
  role: StaffInviteRole;
  acceptedAt: string | null;
  emailMatches: boolean;
};

type ProfileEmbed = { name: string; email: string } | { name: string; email: string }[] | null;

type StaffMembershipRow = {
  id: string;
  role: string;
  profile: ProfileEmbed;
};

type PendingInviteRow = {
  id: string;
  email: string;
  role: string;
  token: string;
  created_at: string;
  organization: OrganizationSummary | OrganizationSummary[] | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const staffInviteQueryKeys = {
  mine: (userId: string) => ["staff-invites", "mine", userId] as const,
  org: (orgId: string) => ["staff-invites", "org", orgId] as const,
  staff: (orgId: string) => ["org-staff", orgId] as const,
  byToken: (token: string) => ["staff-invites", "token", token] as const,
};

export async function listOrgStaff(organizationId: string): Promise<OrgStaffMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("id, role, profile:profiles!memberships_user_id_fkey(name, email)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "instructor"]);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const typed = row as StaffMembershipRow;
      const role = parseStaffInviteRole(typed.role);
      const profile = unwrapOne(typed.profile);
      if (!role || !profile) return null;
      return {
        membershipId: typed.id,
        role,
        name: profile.name,
        email: profile.email,
      };
    })
    .filter((row): row is OrgStaffMember => row !== null);
}

export async function listOrgPendingInvites(
  organizationId: string,
): Promise<PendingStaffInvite[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(
      "id, email, role, token, created_at, organization:organizations(id, name, slug)",
    )
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => toPendingInvite(row as PendingInviteRow))
    .filter((row): row is PendingStaffInvite => row !== null);
}

export async function listMyPendingStaffInvites(
  email: string,
): Promise<PendingStaffInvite[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(
      "id, email, role, token, created_at, organization:organizations(id, name, slug)",
    )
    .eq("email", normalized)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => toPendingInvite(row as PendingInviteRow))
    .filter((row): row is PendingStaffInvite => row !== null);
}

export async function createStaffInvite(input: {
  organizationId: string;
  email: string;
  role: StaffInviteRole;
  invitedBy: string;
}): Promise<PendingStaffInvite> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .insert({
      organization_id: input.organizationId,
      email: input.email,
      role: input.role,
      invited_by: input.invitedBy,
    })
    .select(
      "id, email, role, token, created_at, organization:organizations(id, name, slug)",
    )
    .maybeSingle();

  if (error) throw new Error(staffInviteWriteErrorMessage(error));
  const invite = data ? toPendingInvite(data as PendingInviteRow) : null;
  if (!invite) {
    throw new Error("The invite was created but couldn’t be loaded. Refresh and try again.");
  }
  return invite;
}

export async function cancelStaffInvite(id: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("admin_invites").delete().eq("id", id).is("accepted_at", null);
  if (error) throw new Error(staffInviteWriteErrorMessage(error));
}

export async function getStaffInvite(token: string): Promise<StaffInvitePreview | null> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("get_staff_invite", { p_token: token });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const role = parseStaffInviteRole(row.role);
  if (!role) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
    email: row.email,
    role,
    acceptedAt: row.accepted_at,
    emailMatches: row.email_matches,
  };
}

export async function claimStaffInvite(token: string): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("claim_staff_invite", { p_token: token });
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Couldn’t accept this invite. Try again.");
  }
  return data;
}

function toPendingInvite(row: PendingInviteRow): PendingStaffInvite | null {
  const role = parseStaffInviteRole(row.role);
  const organization = unwrapOne(row.organization);
  if (!role || !organization) return null;
  return {
    id: row.id,
    email: row.email,
    role,
    token: row.token,
    createdAt: row.created_at,
    organization,
  };
}
