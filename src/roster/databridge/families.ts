import { familyWriteErrorMessage } from "@/roster/model/family";
import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import type { ValidatedFamily } from "@/roster/model/family";
import { requireSupabase } from "./client";
import type { StudentSummary } from "./students";

export type FamilyParentMember = {
  memberId: number;
  userId: string;
  name: string;
  email: string;
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
  parents: FamilyParentMember[];
};

export const familyQueryKeys = {
  list: (orgId: number) => ["families", "list", orgId] as const,
  detail: (id: number) => ["families", "detail", id] as const,
  forStudent: (studentId: number) => ["families", "student", studentId] as const,
};

type ProfileEmbed = {
  id: string;
  name: string;
  email: string;
};

type StudentEmbed = {
  id: number;
  organization_id: number;
  name: string;
  grade_level: string | null;
  parent_email: string | null;
};

type FamilyMemberEmbed = {
  id: number;
  student_profile_id: number | null;
  parent_user_id: string | null;
  display_name: string;
  student: StudentEmbed | StudentEmbed[] | null;
  parent: ProfileEmbed | ProfileEmbed[] | null;
};

type FamilyRow = {
  id: number;
  organization_id: number;
  display_name: string | null;
  members: FamilyMemberEmbed[] | FamilyMemberEmbed | null;
};

const FAMILY_SELECT = `
  id,
  organization_id,
  display_name,
  members:family_members(
    id,
    student_profile_id,
    parent_user_id,
    display_name,
    student:student_profiles!family_members_student_profile_id_fkey(
      id, organization_id, name, grade_level, parent_email
    ),
    parent:profiles!family_members_parent_user_id_fkey(id, name, email)
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
  };
}

function toFamilyRecord(row: FamilyRow): FamilyRecord {
  const memberRows = row.members
    ? Array.isArray(row.members)
      ? row.members
      : [row.members]
    : [];

  const students: FamilyStudentMember[] = [];
  const parents: FamilyParentMember[] = [];

  for (const member of memberRows) {
    if (member.student_profile_id) {
      const student = unwrapOne(member.student);
      if (!student) continue;
      students.push({ memberId: member.id, student: toStudentSummary(student) });
      continue;
    }

    if (!member.parent_user_id) continue;
    const parent = unwrapOne(member.parent);
    parents.push({
      memberId: member.id,
      userId: member.parent_user_id,
      name: parent?.name || member.display_name,
      email: parent?.email ?? "",
    });
  }

  students.sort((a, b) => a.student.name.localeCompare(b.student.name));
  parents.sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    students,
    parents,
  };
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
  return (data ?? []).map((row) => toFamilyRecord(row as FamilyRow));
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
  return toFamilyRecord(data as FamilyRow);
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
      },
    ];
  });
}

export async function addFamilyStudent(
  familyId: number,
  student: StudentSummary,
): Promise<void> {
  const family = await getFamily(familyId);
  if (!family) {
    throw new Error("We couldn’t find that family.");
  }

  await ensureParentStudentLinks(
    family.parents.map((parent) => parent.userId),
    [student.id],
  );

  const db = requireSupabase();
  const { error } = await db.from("family_members").insert({
    family_id: familyId,
    student_profile_id: student.id,
    display_name: student.name,
  });

  if (error) throw new Error(familyWriteErrorMessage(error));
}

export async function addFamilyParent(
  familyId: number,
  parent: { userId: string; name: string; email: string },
): Promise<void> {
  const family = await getFamily(familyId);
  if (!family) {
    throw new Error("We couldn’t find that family.");
  }

  await ensureParentStudentLinks(
    [parent.userId],
    family.students.map((member) => member.student.id),
  );

  const db = requireSupabase();
  const { error } = await db.from("family_members").insert({
    family_id: familyId,
    parent_user_id: parent.userId,
    display_name: parent.name || parent.email,
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
  parentUserIds: string[],
  studentProfileIds: number[],
): Promise<void> {
  if (parentUserIds.length === 0 || studentProfileIds.length === 0) return;

  const db = requireSupabase();
  const results = await Promise.all(
    parentUserIds.flatMap((parentUserId) =>
      studentProfileIds.map(async (studentProfileId) => {
        const { error } = await db.from("parent_student_links").insert({
          parent_user_id: parentUserId,
          student_profile_id: studentProfileId,
        });
        return error;
      }),
    ),
  );

  for (const error of results) {
    if (!error) continue;
    if (error.code === "23505") continue;
    throw new Error(rosterWriteErrorMessage(error));
  }
}
