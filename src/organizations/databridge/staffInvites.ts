import type { OrgRole, StaffInviteRole } from "@/organizations/model/role";
import { parseOrgRole, parseStaffInviteRole } from "@/organizations/model/role";
import {
  inviteWriteErrorMessage,
  normalizeInviteEmail,
  staffAddForExistingPerson,
} from "@/organizations/model/staffInvite";
import { requireSupabase } from "./client";
import { parentOrgProfileIdForStudent } from "@/roster/databridge/parentLinks";
import {
  createOrgPerson,
  findOrgProfileByEmail,
  orgContactsByUserId,
  updateOrgPersonContact,
} from "./orgNames";
import {
  listOrgPeople,
  toOrganizationSummary,
  updateStaffMembershipRole,
  type OrganizationSummary,
  type OrganizationSummaryRow,
  type OrgPerson,
} from "./memberships";

export type OrgStaffMember = {
  membershipId: number;
  userId: string;
  role: OrgRole;
  name: string;
  email: string;
  orgProfileId: number | null;
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
  orgProfileId: number | null;
  name: string | null;
  userId: string | null;
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
  parentOrgProfileId: number;
  parentUserId: string | null;
  name: string;
  email: string;
};

type StaffMembershipRow = {
  id: number;
  user_id: string | null;
  role: string;
};

type PendingInviteRow = {
  id: number;
  email: string;
  role: string;
  token: string;
  created_at: string;
  student_profile_id: number | null;
  org_profile_id: number | null;
  organization: OrganizationSummaryRow | OrganizationSummaryRow[] | null;
  org_profile?:
    | { id: number; name: string; user_id: string | null }
    | { id: number; name: string; user_id: string | null }[]
    | null;
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
  "id, email, role, token, created_at, student_profile_id, org_profile_id, organization:organizations(id, name, slug, school_days, about, address, website, contact_email, phone), org_profile:org_profiles!admin_invites_org_profile_id_fkey(id, name, user_id), invite_students:admin_invite_students(student_profile_id)";

export async function listOrgStaff(organizationId: number): Promise<OrgStaffMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("id, user_id, role")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "instructor", "observer", "parent"]);

  if (error) throw new Error(error.message);

  const members: OrgStaffMember[] = [];
  for (const row of data ?? []) {
    const typed = row as StaffMembershipRow;
    const role = parseOrgRole(typed.role);
    if (!role || !typed.user_id || !Number.isFinite(typed.id)) continue;
    members.push({
      membershipId: typed.id,
      userId: typed.user_id,
      role,
      name: "",
      email: "",
      orgProfileId: null,
      hasLinkedStudent: false,
      hasStudentAccount: false,
    });
  }

  const contacts = await orgContactsByUserId(
    organizationId,
    members.map((member) => member.userId),
  );
  const named: OrgStaffMember[] = [];
  for (const member of members) {
    const contact = contacts.get(member.userId);
    if (!contact) continue;
    named.push({
      ...member,
      name: contact.name,
      email: contact.email ?? "",
      orgProfileId: contact.id,
    });
  }

  const userIds = named.map((member) => member.userId);
  const [linkedParents, studentAccounts] = await Promise.all([
    listLinkedParentUserIds(organizationId, userIds),
    listStudentAccountUserIds(organizationId, userIds),
  ]);

  return named.map((member) => ({
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
    .from("org_profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("counts_as_student", true);

  if (studentsError) throw new Error(studentsError.message);

  const studentIds = (students ?? []).map((row) => row.id);
  if (studentIds.length === 0) return new Set();

  const { data, error } = await db
    .from("parent_student_links")
    .select("parent:org_profiles!parent_student_links_parent_org_profile_id_fkey(user_id)")
    .in("student_profile_id", studentIds);

  if (error) throw new Error(error.message);

  const linked = new Set<string>();
  for (const row of data ?? []) {
    const parent = Array.isArray(row.parent) ? row.parent[0] : row.parent;
    if (parent?.user_id && userIds.includes(parent.user_id)) {
      linked.add(parent.user_id);
    }
  }
  return linked;
}

async function listStudentAccountUserIds(
  organizationId: number,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();

  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("counts_as_student", true)
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
      "parent_org_profile_id, student_profile_id, parent:org_profiles!parent_student_links_parent_org_profile_id_fkey(name, email, user_id)",
    )
    .in("student_profile_id", studentIds);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const parent = unwrapOne(row.parent);
    return {
      studentProfileId: row.student_profile_id,
      parentOrgProfileId: row.parent_org_profile_id,
      parentUserId: parent?.user_id ?? null,
      name: parent?.name || parent?.email || "Parent",
      email: parent?.email ?? "",
    };
  });
}

export type InviteEmailStatus = {
  sent: boolean;
  error: string | null;
};

export type CreatedOrgInvite<T> =
  | {
      invite: T;
      email: InviteEmailStatus;
      attached?: boolean;
      linked?: false;
    }
  | {
      invite: null;
      email: InviteEmailStatus;
      linked: true;
      linkedParent: Pick<OrgPerson, "userId" | "name" | "email">;
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

export type StaffAddResult =
  | { kind: "invited"; invite: PendingStaffInvite; email: InviteEmailStatus }
  | {
      kind: "stacked";
      name: string;
      email: string;
      role: StaffInviteRole;
      stayedParent: boolean;
      stayedStudent: boolean;
    };

async function profileLinkedAsParent(orgProfileId: number): Promise<boolean> {
  const db = requireSupabase();
  const [links, invites] = await Promise.all([
    db
      .from("parent_student_links")
      .select("student_profile_id")
      .eq("parent_org_profile_id", orgProfileId)
      .limit(1),
    db
      .from("admin_invites")
      .select("id")
      .eq("org_profile_id", orgProfileId)
      .eq("role", "parent")
      .limit(1),
  ]);
  if (links.error) throw new Error(links.error.message);
  if (invites.error) throw new Error(invites.error.message);
  return (links.data?.length ?? 0) > 0 || (invites.data?.length ?? 0) > 0;
}

export async function createStaffInvite(input: {
  organizationId: number;
  name: string;
  email: string;
  role: StaffInviteRole;
  invitedBy: string;
}): Promise<StaffAddResult> {
  let existing = await findOrgProfileByEmail(input.organizationId, input.email);
  let countsAsStudent = false;
  let linkedAsParent = false;
  if (existing) {
    const db = requireSupabase();
    const { data: row, error } = await db
      .from("org_profiles")
      .select("counts_as_student")
      .eq("id", existing.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    countsAsStudent = Boolean(row?.counts_as_student);
    linkedAsParent = await profileLinkedAsParent(existing.id);
  }

  let membership: {
    id: number;
    role: string;
    is_parent: boolean;
    is_student: boolean;
  } | null = null;
  if (existing?.userId) {
    const db = requireSupabase();
    const { data, error } = await db
      .from("memberships")
      .select("id, role, is_parent, is_student")
      .eq("organization_id", input.organizationId)
      .eq("user_id", existing.userId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    membership = data;
  }

  const membershipRole = membership ? parseOrgRole(membership.role) : null;
  const decision = staffAddForExistingPerson({
    hasAccount: Boolean(existing?.userId),
    countsAsStudent,
    linkedAsParent: linkedAsParent || membershipRole === "parent" || Boolean(membership?.is_parent),
    membershipRole,
  });

  if (decision.action === "reject") {
    throw new Error(decision.message);
  }

  if (decision.action === "stack-role") {
    if (!existing || !membership) {
      throw new Error("That person couldn’t be updated. Refresh and try again.");
    }
    await updateStaffMembershipRole({
      membershipId: membership.id,
      role: input.role,
    });
    return {
      kind: "stacked",
      name: existing.name,
      email: existing.email ?? input.email,
      role: input.role,
      stayedParent: true,
      stayedStudent: Boolean(membership.is_student),
    };
  }

  if (existing && !decision.keepName) {
    const name = input.name.trim();
    if (name && name !== existing.name) {
      await updateOrgPersonContact({ orgProfileId: existing.id, name });
      existing = { ...existing, name };
    }
  }

  const orgProfile =
    existing ??
    (await createOrgPerson({
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
    }));

  const invite = await insertInvite({
    organizationId: input.organizationId,
    email: input.email,
    role: input.role,
    invitedBy: input.invitedBy,
    studentProfileId: null,
    orgProfileId: orgProfile.id,
  });
  const staff = toPendingStaffInviteFromInvite(invite);
  if (!staff) {
    throw new Error("The invite was created but couldn’t be loaded. Refresh and try again.");
  }
  return { kind: "invited", invite: staff, email: { sent: false, error: null } };
}

export async function findOrgPersonByEmail(
  organizationId: number,
  email: string,
): Promise<OrgPerson | null> {
  const normalized = normalizeInviteEmail(email);
  if (!normalized) return null;
  const people = await listOrgPeople(organizationId);
  return people.find((person) => normalizeInviteEmail(person.email) === normalized) ?? null;
}

async function ensureParentStudentLink(
  parentUserId: string,
  studentProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const parentOrgProfileId = await parentOrgProfileIdForStudent(
    parentUserId,
    studentProfileId,
  );
  const { error } = await db.from("parent_student_links").insert({
    parent_org_profile_id: parentOrgProfileId,
    student_profile_id: studentProfileId,
  });
  if (error) {
    if (error.code === "23505") return;
    throw new Error(inviteWriteErrorMessage(error));
  }
}

export async function createParentInvite(input: {
  organizationId: number;
  studentProfileId: number;
  email: string;
  invitedBy: string;
  sendEmail?: boolean;
  orgProfileId?: number | null;
}): Promise<CreatedOrgInvite<PendingOrgInvite>> {
  const email = input.email.trim().toLowerCase();
  const orgMember = await findOrgPersonByEmail(input.organizationId, email);
  if (orgMember) {
    await ensureParentStudentLink(orgMember.userId, input.studentProfileId);
    const staleInvite = await findPendingParentInvite(input.organizationId, email);
    if (staleInvite) {
      await cancelInvite(staleInvite.id);
    }
    return {
      invite: null,
      email: { sent: false, error: null },
      linked: true,
      linkedParent: {
        userId: orgMember.userId,
        name: orgMember.name,
        email: orgMember.email,
      },
    };
  }

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
      orgProfileId: input.orgProfileId,
    });
    const emailStatus = input.sendEmail
      ? await sendOrganizationInviteEmail(invite.id)
      : { sent: false, error: null };
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
    .from("org_profiles")
    .select("id, user_id, name, email")
    .eq("id", studentProfileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.user_id) return null;
  return {
    studentProfileId: data.id,
    userId: data.user_id,
    name: data.name,
    email: data.email ?? "",
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
  orgProfileId?: number | null;
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
      org_profile_id: input.orgProfileId ?? undefined,
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
  const orgProfile = unwrapOne(row.org_profile);
  return {
    id: row.id,
    email: row.email,
    role,
    token: row.token,
    createdAt: row.created_at,
    studentProfileId: row.student_profile_id,
    studentProfileIds,
    orgProfileId: orgProfile?.id ?? row.org_profile_id,
    name: orgProfile?.name ?? null,
    userId: orgProfile?.user_id ?? null,
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
