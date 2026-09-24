import type { OrgRole, StaffInviteRole } from "@/organizations/model/role";
import { parseOrgRole, parseStaffInviteRole } from "@/organizations/model/role";
import { inviteWriteErrorMessage } from "@/organizations/model/staffInvite";
import { requireSupabase } from "./client";
import {
  toOrganizationSummary,
  type OrganizationSummary,
  type OrganizationSummaryRow,
} from "./memberships";

export type OrgStaffMember = {
  membershipId: number;
  userId: string;
  role: OrgRole;
  name: string;
  email: string;
  hasLinkedStudent: boolean;
  hasStudentAccount: boolean;
};

export type PendingOrgInvite = {
  id: number;
  email: string;
  role: OrgRole;
  token: string;
  createdAt: string;
  studentProfileId: number | null;
  studentProfileIds: number[];
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
  organization: OrganizationSummaryRow | OrganizationSummaryRow[] | null;
  invite_students?:
    | { student_profile_id: number }[]
    | { student_profile_id: number }
    | null;
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
  students: (orgId: number) => ["org-invites", "students", orgId] as const,
  parentLinks: (studentIds: number[]) =>
    ["parent-links", ...studentIds.slice().sort((a, b) => a - b)] as const,
};

const INVITE_COLUMNS =
  "id, email, role, token, created_at, student_profile_id, organization:organizations(id, name, slug, school_days, about, address, website, contact_email, phone), invite_students:admin_invite_students(student_profile_id)";

export async function listOrgStaff(organizationId: number): Promise<OrgStaffMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("id, user_id, role, profile:profiles!memberships_user_id_fkey(name, email)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "instructor", "observer", "parent"]);

  if (error) throw new Error(error.message);

  const members = (data ?? [])
    .map((row) => {
      const typed = row as StaffMembershipRow;
      const role = parseOrgRole(typed.role);
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
        hasLinkedStudent: false,
        hasStudentAccount: false,
      };
    })
    .filter((row): row is OrgStaffMember => row !== null);

  const userIds = members.map((member) => member.userId);
  const [linkedParents, studentAccounts] = await Promise.all([
    listLinkedParentUserIds(organizationId, userIds),
    listStudentAccountUserIds(organizationId, userIds),
  ]);

  return members.map((member) => ({
    ...member,
    hasLinkedStudent: linkedParents.has(member.userId),
    hasStudentAccount: studentAccounts.has(member.userId),
  }));
}

async function listLinkedParentUserIds(
  organizationId: number,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const db = requireSupabase();
  const { data: students, error: studentsError } = await db
    .from("student_profiles")
    .select("id")
    .eq("organization_id", organizationId);

  if (studentsError) throw new Error(studentsError.message);

  const studentIds = (students ?? []).map((row) => row.id);
  if (studentIds.length === 0) return new Set();

  const { data, error } = await db
    .from("parent_student_links")
    .select("parent_user_id")
    .in("parent_user_id", userIds)
    .in("student_profile_id", studentIds);

  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((row) => row.parent_user_id));
}

async function listStudentAccountUserIds(
  organizationId: number,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select("user_id")
    .eq("organization_id", organizationId)
    .in("user_id", userIds);

  if (error) throw new Error(error.message);

  return new Set(
    (data ?? [])
      .map((row) => row.user_id)
      .filter((id): id is string => Boolean(id)),
  );
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
    .in("role", ["owner", "admin", "instructor", "observer"])
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
  attached?: boolean;
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
  const email = input.email.trim().toLowerCase();
  const existing = await findPendingParentInvite(input.organizationId, email);
  if (existing) {
    return attachToExistingParentInvite(existing, input.studentProfileId);
  }

  try {
    const invite = await insertInvite({
      organizationId: input.organizationId,
      email,
      role: "parent",
      invitedBy: input.invitedBy,
      studentProfileId: input.studentProfileId,
    });
    const emailStatus = await sendOrganizationInviteEmail(invite.id);
    return { invite, email: emailStatus, attached: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("already has a pending invite")) throw error;
    const raced = await findPendingParentInvite(input.organizationId, email);
    if (!raced) throw error;
    return attachToExistingParentInvite(raced, input.studentProfileId);
  }
}

export async function createStudentInvite(input: {
  organizationId: number;
  studentProfileId: number;
  email: string;
  invitedBy: string;
}): Promise<CreatedOrgInvite<PendingOrgInvite>> {
  const email = input.email.trim().toLowerCase();
  const invite = await insertInvite({
    organizationId: input.organizationId,
    email,
    role: "student",
    invitedBy: input.invitedBy,
    studentProfileId: input.studentProfileId,
  });
  const emailStatus = await sendOrganizationInviteEmail(invite.id);
  return { invite, email: emailStatus, attached: false };
}

export async function listOrgPendingStudentInvites(
  organizationId: number,
): Promise<PendingOrgInvite[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(INVITE_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("role", "student")
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => toPendingInvite(row as PendingInviteRow))
    .filter((row): row is PendingOrgInvite => row !== null);
}

export type StudentAccountLink = {
  studentProfileId: number;
  userId: string;
  name: string;
  email: string;
};

export async function getStudentAccountLink(
  studentProfileId: number,
): Promise<StudentAccountLink | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select("id, user_id, profile:profiles!student_profiles_user_id_fkey(name, email)")
    .eq("id", studentProfileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.user_id) return null;
  const profile = unwrapOne(
    data.profile as ProfileEmbed,
  );
  if (!profile) return null;
  return {
    studentProfileId: data.id,
    userId: data.user_id,
    name: profile.name,
    email: profile.email,
  };
}

async function attachToExistingParentInvite(
  existing: PendingOrgInvite,
  studentProfileId: number,
): Promise<CreatedOrgInvite<PendingOrgInvite>> {
  await attachStudentToParentInvite(existing.id, studentProfileId);
  const invite = await getPendingParentInviteById(existing.id);
  return {
    invite: invite ?? {
      ...existing,
      studentProfileIds: Array.from(
        new Set([...existing.studentProfileIds, studentProfileId]),
      ),
    },
    email: { sent: false, error: null },
    attached: true,
  };
}

async function findPendingParentInvite(
  organizationId: number,
  email: string,
): Promise<PendingOrgInvite | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(INVITE_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("role", "parent")
    .is("accepted_at", null)
    .maybeSingle();

  if (error) throw new Error(inviteWriteErrorMessage(error));
  return data ? toPendingInvite(data as PendingInviteRow) : null;
}

async function getPendingParentInviteById(
  inviteId: number,
): Promise<PendingOrgInvite | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select(INVITE_COLUMNS)
    .eq("id", inviteId)
    .maybeSingle();

  if (error) throw new Error(inviteWriteErrorMessage(error));
  return data ? toPendingInvite(data as PendingInviteRow) : null;
}

export async function attachStudentToParentInvite(
  inviteId: number,
  studentProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("admin_invite_students").insert({
    invite_id: inviteId,
    student_profile_id: studentProfileId,
  });
  if (error) {
    if (error.code === "23505") return;
    throw new Error(inviteWriteErrorMessage(error));
  }
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
  const organizationRow = unwrapOne(row.organization);
  if (!role || !organizationRow) return null;
  const organization = toOrganizationSummary(organizationRow);
  const fromJunction = Array.isArray(row.invite_students)
    ? row.invite_students.map((entry) => entry.student_profile_id)
    : row.invite_students
      ? [row.invite_students.student_profile_id]
      : [];
  const studentProfileIds = Array.from(
    new Set([
      ...fromJunction,
      ...(row.student_profile_id != null ? [row.student_profile_id] : []),
    ]),
  );
  return {
    id: row.id,
    email: row.email,
    role,
    token: row.token,
    createdAt: row.created_at,
    studentProfileId: row.student_profile_id,
    studentProfileIds,
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
