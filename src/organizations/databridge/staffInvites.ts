import type { OrgRole, StaffInviteRole } from "@/organizations/model/role";
import { parseOrgRole, parseStaffInviteRole } from "@/organizations/model/role";
import { inviteWriteErrorMessage } from "@/organizations/model/staffInvite";
import { requireSupabase } from "./client";
import type { OrganizationSummary } from "./memberships";

export type OrgStaffMember = {
  membershipId: number;
  userId: string;
  role: StaffInviteRole;
  name: string;
  email: string;
};

export type PendingOrgInvite = {
  id: number;
  email: string;
  role: OrgRole;
  token: string;
  createdAt: string;
  studentProfileId: number | null;
  organization: OrganizationSummary;
};

export type PendingStaffInvite = PendingOrgInvite & { role: StaffInviteRole };

export type InvitePreview = {
  id: number;
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  email: string;
  role: OrgRole;
  studentProfileId: number | null;
  studentName: string | null;
  acceptedAt: string | null;
  emailMatches: boolean;
};

export type StaffInvitePreview = InvitePreview & { role: StaffInviteRole };

export type ParentLinkStatus = {
  studentProfileId: number;
  parentUserId: string;
  name: string;
  email: string;
};

type ProfileEmbed = { name: string; email: string } | { name: string; email: string }[] | null;

type StaffMembershipRow = {
  id: number;
  user_id: string | null;
  role: string;
  profile: ProfileEmbed;
};

type PendingInviteRow = {
  id: number;
  email: string;
  role: string;
  token: string;
  created_at: string;
  student_profile_id: number | null;
  organization: OrganizationSummary | OrganizationSummary[] | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const staffInviteQueryKeys = {
  mine: (userId: string) => ["org-invites", "mine", userId] as const,
  org: (orgId: number) => ["org-invites", "staff", orgId] as const,
  staff: (orgId: number) => ["org-staff", orgId] as const,
  byToken: (token: string) => ["org-invites", "token", token] as const,
  parents: (orgId: number) => ["org-invites", "parents", orgId] as const,
  parentLinks: (studentIds: number[]) =>
    ["parent-links", ...studentIds.slice().sort((a, b) => a - b)] as const,
};

const INVITE_COLUMNS =
  "id, email, role, token, created_at, student_profile_id, organization:organizations(id, name, slug)";

export async function listOrgStaff(organizationId: number): Promise<OrgStaffMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("id, user_id, role, profile:profiles!memberships_user_id_fkey(name, email)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "instructor"]);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const typed = row as StaffMembershipRow;
      const role = parseStaffInviteRole(typed.role);
      const profile = unwrapOne(typed.profile);
      if (!role || !profile || !typed.user_id || !Number.isFinite(typed.id)) {
        return null;
      }
      return {
        membershipId: typed.id,
        userId: typed.user_id,
        role,
        name: profile.name,
        email: profile.email,
      };
    })
    .filter((row): row is OrgStaffMember => row !== null);
}

export async function listOrgPendingInvites(
  organizationId: number,
): Promise<PendingStaffInvite[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(INVITE_COLUMNS)
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .in("role", ["owner", "admin", "instructor"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => toPendingStaffInvite(row as PendingInviteRow))
    .filter((row): row is PendingStaffInvite => row !== null);
}

export async function listOrgPendingParentInvites(
  organizationId: number,
): Promise<PendingOrgInvite[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(INVITE_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("role", "parent")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => toPendingInvite(row as PendingInviteRow))
    .filter((row): row is PendingOrgInvite => row !== null);
}

export async function listMyPendingInvites(email: string): Promise<PendingOrgInvite[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(INVITE_COLUMNS)
    .eq("email", normalized)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => toPendingInvite(row as PendingInviteRow))
    .filter((row): row is PendingOrgInvite => row !== null);
}

export async function listMyPendingStaffInvites(
  email: string,
): Promise<PendingOrgInvite[]> {
  return listMyPendingInvites(email);
}

export async function listParentLinksForStudents(
  studentIds: number[],
): Promise<ParentLinkStatus[]> {
  if (studentIds.length === 0) return [];

  const db = requireSupabase();
  const { data, error } = await db
    .from("parent_student_links")
    .select(
      "parent_user_id, student_profile_id, parent:profiles!parent_student_links_parent_user_id_fkey(name, email)",
    )
    .in("student_profile_id", studentIds);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const parent = unwrapOne(row.parent);
    return {
      studentProfileId: row.student_profile_id,
      parentUserId: row.parent_user_id,
      name: parent?.name || parent?.email || "Parent",
      email: parent?.email ?? "",
    };
  });
}

export type InviteEmailStatus = {
  sent: boolean;
  error: string | null;
};

export type CreatedOrgInvite<T> = {
  invite: T;
  email: InviteEmailStatus;
};

export async function sendOrganizationInviteEmail(
  inviteId: number,
): Promise<InviteEmailStatus> {
  const db = requireSupabase();
  const { data, error } = await db.functions.invoke("send-organization-invite", {
    body: { inviteId },
  });
  const fromBody = await readFunctionErrorBody(data, error);
  if (error || fromBody) {
    return {
      sent: false,
      error: fromBody ?? functionErrorMessage(error, "Couldn’t send the invite email."),
    };
  }
  return { sent: true, error: null };
}

export async function createStaffInvite(input: {
  organizationId: number;
  email: string;
  role: StaffInviteRole;
  invitedBy: string;
}): Promise<CreatedOrgInvite<PendingStaffInvite>> {
  const invite = await insertInvite({
    organizationId: input.organizationId,
    email: input.email,
    role: input.role,
    invitedBy: input.invitedBy,
    studentProfileId: null,
  });
  const staff = toPendingStaffInviteFromInvite(invite);
  if (!staff) {
    throw new Error("The invite was created but couldn’t be loaded. Refresh and try again.");
  }
  const email = await sendOrganizationInviteEmail(staff.id);
  return { invite: staff, email };
}

export async function createParentInvite(input: {
  organizationId: number;
  studentProfileId: number;
  email: string;
  invitedBy: string;
}): Promise<CreatedOrgInvite<PendingOrgInvite>> {
  const invite = await insertInvite({
    organizationId: input.organizationId,
    email: input.email,
    role: "parent",
    invitedBy: input.invitedBy,
    studentProfileId: input.studentProfileId,
  });
  const email = await sendOrganizationInviteEmail(invite.id);
  return { invite, email };
}

export async function cancelInvite(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("admin_invites").delete().eq("id", id).is("accepted_at", null);
  if (error) throw new Error(inviteWriteErrorMessage(error));
}

export async function cancelStaffInvite(id: number): Promise<void> {
  return cancelInvite(id);
}

export async function getInvite(token: string): Promise<InvitePreview | null> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("get_invite", { p_token: token });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const role = parseOrgRole(row.role);
  if (!role) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationSlug: row.organization_slug,
    email: row.email,
    role,
    studentProfileId: row.student_profile_id,
    studentName: row.student_name,
    acceptedAt: row.accepted_at,
    emailMatches: row.email_matches,
  };
}

export async function getStaffInvite(token: string): Promise<InvitePreview | null> {
  return getInvite(token);
}

export async function claimInvite(token: string): Promise<string> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("claim_invite", { p_token: token });
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("Couldn’t accept this invite. Try again.");
  }
  return data;
}

export async function claimStaffInvite(token: string): Promise<string> {
  return claimInvite(token);
}

async function insertInvite(input: {
  organizationId: number;
  email: string;
  role: OrgRole;
  invitedBy: string;
  studentProfileId: number | null;
}): Promise<PendingOrgInvite> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .insert({
      organization_id: input.organizationId,
      email: input.email,
      role: input.role,
      invited_by: input.invitedBy,
      student_profile_id: input.studentProfileId,
    })
    .select(INVITE_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(inviteWriteErrorMessage(error));
  const invite = data ? toPendingInvite(data as PendingInviteRow) : null;
  if (!invite) {
    throw new Error("The invite was created but couldn’t be loaded. Refresh and try again.");
  }
  return invite;
}

function toPendingInvite(row: PendingInviteRow): PendingOrgInvite | null {
  const role = parseOrgRole(row.role);
  const organization = unwrapOne(row.organization);
  if (!role || !organization) return null;
  return {
    id: row.id,
    email: row.email,
    role,
    token: row.token,
    createdAt: row.created_at,
    studentProfileId: row.student_profile_id,
    organization,
  };
}

function toPendingStaffInvite(row: PendingInviteRow): PendingStaffInvite | null {
  const invite = toPendingInvite(row);
  return invite ? toPendingStaffInviteFromInvite(invite) : null;
}

function toPendingStaffInviteFromInvite(
  invite: PendingOrgInvite,
): PendingStaffInvite | null {
  const role = parseStaffInviteRole(invite.role);
  if (!role) return null;
  return { ...invite, role };
}

async function readFunctionErrorBody(
  data: unknown,
  error: { message: string; context?: unknown } | null,
): Promise<string | null> {
  const fromData = errorString(data);
  if (fromData) return fromData;

  const context = error?.context;
  if (context instanceof Response) {
    try {
      const body: unknown = await context.clone().json();
      return errorString(body);
    } catch {
      return null;
    }
  }
  return errorString(context);
}

function errorString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  ) {
    return (value as { error: string }).error;
  }
  return null;
}

function functionErrorMessage(
  error: { message: string } | null,
  fallback: string,
): string {
  const message = error?.message.trim() ?? "";
  if (!message || message.toLowerCase() === "edge function returned a non-2xx status code") {
    return fallback;
  }
  return message;
}
