import { sendOrganizationInviteEmail } from "@/organizations/databridge/staffInvites";
import { familyWriteErrorMessage } from "@/roster/model/family";
import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import type { ValidatedFamily } from "@/roster/model/family";
import { requireSupabase } from "./client";
import type { StudentSummary } from "./students";

export type FamilyParent = {
  userId: string;
  name: string;
  email: string;
  studentIds: number[];
};

export type PendingParentInvite = {
  id: number;
  email: string;
  studentProfileId: number;
};

export type FamilyStudentMember = {
  memberId: number;
  student: StudentSummary;
};

export type FamilyRecord = {
  id: number;
  organizationId: number;
  displayName: string | null;
  students: FamilyStudentMember[];
  parents: FamilyParent[];
  pendingInvites: PendingParentInvite[];
};

export const familyQueryKeys = {
  list: (orgId: number) => ["families", "list", orgId] as const,
  detail: (id: number) => ["families", "detail", id] as const,
  forStudent: (studentId: number) => ["families", "student", studentId] as const,
};

type StudentEmbed = {
  id: number;
  organization_id: number;
  name: string;
  grade_level: string | null;
  parent_email: string | null;
  student_email: string | null;
};

type FamilyMemberEmbed = {
  id: number;
  student_profile_id: number | null;
  display_name: string;
  student: StudentEmbed | StudentEmbed[] | null;
};

type FamilyRow = {
  id: number;
  organization_id: number;
  display_name: string | null;
  members: FamilyMemberEmbed[] | FamilyMemberEmbed | null;
};

type ParentLinkRow = {
  parent_user_id: string;
  student_profile_id: number;
  parent: { id: string; name: string; email: string } | { id: string; name: string; email: string }[] | null;
};

const FAMILY_SELECT = `
  id,
  organization_id,
  display_name,
  members:family_members(
    id,
    student_profile_id,
    display_name,
    student:student_profiles!family_members_student_profile_id_fkey(
      id, organization_id, name, grade_level, parent_email, student_email
    )
  )
`;

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toStudentSummary(row: StudentEmbed): StudentSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    gradeLevel: row.grade_level,
    parentEmail: row.parent_email,
    studentEmail: row.student_email,
  };
}

function toFamilyRecord(row: FamilyRow): FamilyRecord {
  const memberRows = row.members
    ? Array.isArray(row.members)
      ? row.members
      : [row.members]
    : [];

  const students: FamilyStudentMember[] = [];
  for (const member of memberRows) {
    if (!member.student_profile_id) continue;
    const student = unwrapOne(member.student);
    if (!student) continue;
    students.push({ memberId: member.id, student: toStudentSummary(student) });
  }
  students.sort((a, b) => a.student.name.localeCompare(b.student.name));

  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    students,
    parents: [],
    pendingInvites: [],
  };
}

function parentsFromLinks(
  studentIds: number[],
  links: ParentLinkRow[],
): FamilyParent[] {
  const wanted = new Set(studentIds);
  const byParent = new Map<string, FamilyParent>();

  for (const link of links) {
    if (!wanted.has(link.student_profile_id)) continue;
    const profile = unwrapOne(link.parent);
    const existing = byParent.get(link.parent_user_id);
    if (existing) {
      if (!existing.studentIds.includes(link.student_profile_id)) {
        existing.studentIds.push(link.student_profile_id);
      }
      continue;
    }
    byParent.set(link.parent_user_id, {
      userId: link.parent_user_id,
      name: profile?.name || profile?.email || "Parent",
      email: profile?.email ?? "",
      studentIds: [link.student_profile_id],
    });
  }

  return [...byParent.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function listParentLinks(studentIds: number[]): Promise<ParentLinkRow[]> {
  if (studentIds.length === 0) return [];
  const db = requireSupabase();
  const { data, error } = await db
    .from("parent_student_links")
    .select(
      "parent_user_id, student_profile_id, parent:profiles!parent_student_links_parent_user_id_fkey(id, name, email)",
    )
    .in("student_profile_id", studentIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as ParentLinkRow[];
}

async function attachParents(families: FamilyRecord[]): Promise<FamilyRecord[]> {
  const studentIds = families.flatMap((family) =>
    family.students.map((member) => member.student.id),
  );
  const links = await listParentLinks(studentIds);
  return families.map((family) => ({
    ...family,
    parents: parentsFromLinks(
      family.students.map((member) => member.student.id),
      links,
    ),
  }));
}

async function listPendingInvites(
  studentIds: number[],
): Promise<PendingParentInvite[]> {
  if (studentIds.length === 0) return [];
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_invites")
    .select("id, email, student_profile_id")
    .eq("role", "parent")
    .in("student_profile_id", studentIds)
    .is("accepted_at", null)
    .order("created_at");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    if (row.student_profile_id == null) return [];
    return [
      {
        id: row.id,
        email: row.email,
        studentProfileId: row.student_profile_id,
      },
    ];
  });
}

export async function listFamilies(
  organizationId: number,
): Promise<FamilyRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("families")
    .select(FAMILY_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("display_name");

  if (error) throw new Error(error.message);
  return attachParents((data ?? []).map((row) => toFamilyRecord(row as FamilyRow)));
}

export async function getFamily(id: number): Promise<FamilyRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("families")
    .select(FAMILY_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [family] = await attachParents([toFamilyRecord(data as FamilyRow)]);
  const studentIds = family.students.map((member) => member.student.id);
  return {
    ...family,
    pendingInvites: await listPendingInvites(studentIds),
  };
}

export async function createFamily(
  organizationId: number,
  input: ValidatedFamily,
): Promise<FamilyRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("families")
    .insert({
      organization_id: organizationId,
      display_name: input.displayName,
    })
    .select(FAMILY_SELECT)
    .maybeSingle();

  if (error) throw new Error(familyWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to create a family.");
  }
  return toFamilyRecord(data as FamilyRow);
}

export async function listFamiliesForStudent(
  studentProfileId: number,
): Promise<FamilyRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("family_members")
    .select("family:families(id, organization_id, display_name, deleted_at)")
    .eq("student_profile_id", studentProfileId);

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const familyRow = unwrapOne(
      row.family as {
        id: number;
        organization_id: number;
        display_name: string | null;
        deleted_at: string | null;
      } | null,
    );
    if (!familyRow || familyRow.deleted_at) return [];
    return [
      {
        id: familyRow.id,
        organizationId: familyRow.organization_id,
        displayName: familyRow.display_name,
        students: [],
        parents: [],
        pendingInvites: [],
      },
    ];
  });
}

export async function addFamilyStudent(
  familyId: number,
  student: StudentSummary,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("family_members").insert({
    family_id: familyId,
    student_profile_id: student.id,
    display_name: student.name,
  });

  if (error) throw new Error(familyWriteErrorMessage(error));
}

export async function removeFamilyMember(memberId: number): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("family_members")
    .delete()
    .eq("id", memberId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(familyWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to remove this family member.");
  }
}

export async function ensureParentStudentLinks(
  parentUserId: string,
  studentProfileIds: number[],
): Promise<void> {
  if (studentProfileIds.length === 0) return;

  const db = requireSupabase();
  const results = await Promise.all(
    studentProfileIds.map(async (studentProfileId) => {
      const { error } = await db.from("parent_student_links").insert({
        parent_user_id: parentUserId,
        student_profile_id: studentProfileId,
      });
      return error;
    }),
  );

  for (const error of results) {
    if (!error) continue;
    if (error.code === "23505") continue;
    throw new Error(rosterWriteErrorMessage(error));
  }
}

export async function createParentInvites(input: {
  organizationId: number;
  email: string;
  studentIds: number[];
  invitedBy: string;
}): Promise<void> {
  if (input.studentIds.length === 0) return;

  const db = requireSupabase();
  const results = await Promise.all(
    input.studentIds.map(async (studentProfileId) => {
      const { data, error } = await db
        .from("admin_invites")
        .insert({
          organization_id: input.organizationId,
          email: input.email,
          role: "parent",
          invited_by: input.invitedBy,
          student_profile_id: studentProfileId,
        })
        .select("id")
        .maybeSingle();
      return { data, error };
    }),
  );

  const inviteIds: number[] = [];
  for (const result of results) {
    if (result.error) {
      if (result.error.code === "23505") continue;
      throw new Error(familyWriteErrorMessage(result.error));
    }
    if (result.data?.id) inviteIds.push(result.data.id);
  }

  await Promise.all(inviteIds.map((id) => sendOrganizationInviteEmail(id)));
}
