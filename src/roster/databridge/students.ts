import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import type { ValidatedStudentProfile } from "@/roster/model/studentProfile";
import { requireSupabase } from "./client";

export type StudentSummary = {
  id: number;
  organizationId: number;
  name: string;
  gradeLevel: string | null;
  parentEmail: string | null;
  studentEmail: string | null;
  userId?: string | null;
};

export const studentQueryKeys = {
  list: (orgId: number) => ["students", "list", orgId] as const,
  detail: (id: number) => ["students", "detail", id] as const,
};

export type StudentRow = {
  id: number;
  organization_id: number;
  name: string;
  grade_level: string | null;
  parent_email: string | null;
  email: string | null;
  user_id: string | null;
};

export function toStudentSummary(row: StudentRow): StudentSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    gradeLevel: row.grade_level,
    parentEmail: row.parent_email,
    studentEmail: row.email,
    userId: row.user_id,
  };
}

export const STUDENT_COLUMNS =
  "id, organization_id, name, grade_level, parent_email, email, user_id";

export async function listStudents(
  organizationId: number,
): Promise<StudentSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select(STUDENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("counts_as_student", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toStudentSummary(row));
}

export async function getStudent(id: number): Promise<StudentSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select(STUDENT_COLUMNS)
    .eq("id", id)
    .eq("counts_as_student", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toStudentSummary(data);
}

export async function createStudent(
  organizationId: number,
  input: ValidatedStudentProfile,
  createdViaCourseId?: number,
): Promise<StudentSummary> {
  const created = await createStudents(
    organizationId,
    [input],
    createdViaCourseId,
  );
  const student = created[0];
  if (!student) {
    throw new Error("You don’t have permission to add a student.");
  }
  return student;
}

export async function createStudents(
  organizationId: number,
  inputs: ValidatedStudentProfile[],
  createdViaCourseId?: number,
): Promise<StudentSummary[]> {
  if (inputs.length === 0) return [];
  const db = requireSupabase();
  const created: StudentSummary[] = [];
  const fresh: ValidatedStudentProfile[] = [];

  for (const input of inputs) {
    const email = input.studentEmail;
    if (!email) {
      fresh.push(input);
      continue;
    }
    const { data: existing, error } = await db
      .from("org_profiles")
      .select(
        "id, organization_id, name, grade_level, parent_email, email, user_id, counts_as_student",
      )
      .eq("organization_id", organizationId)
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!existing) {
      fresh.push(input);
      continue;
    }
    if (existing.counts_as_student) {
      throw new Error("That email is already used in this organization.");
    }
    const { error: markError } = await db.rpc("mark_org_profile_as_student", {
      p_org_profile_id: existing.id,
      p_grade_level: input.gradeLevel,
      p_parent_email: input.parentEmail,
      p_created_via_course_id: createdViaCourseId ?? null,
    });
    if (markError) throw new Error(rosterWriteErrorMessage(markError));
    const { data: updated, error: readError } = await db
      .from("org_profiles")
      .select(STUDENT_COLUMNS)
      .eq("id", existing.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!updated) {
      throw new Error("You don’t have permission to add a student.");
    }
    created.push(toStudentSummary(updated));
  }

  if (fresh.length === 0) return created;

  const { data, error } = await db
    .from("org_profiles")
    .insert(
      fresh.map((input) => ({
        organization_id: organizationId,
        name: input.name,
        parent_email: input.parentEmail,
        email: input.studentEmail,
        grade_level: input.gradeLevel,
        counts_as_student: true,
        created_via_course_id: createdViaCourseId ?? null,
      })),
    )
    .select(STUDENT_COLUMNS);

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data || data.length === 0) {
    throw new Error("You don’t have permission to add a student.");
  }
  return [...created, ...data.map((row) => toStudentSummary(row))];
}

export async function updateStudent(
  id: number,
  input: ValidatedStudentProfile,
): Promise<StudentSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .update({
      name: input.name,
      parent_email: input.parentEmail,
      email: input.studentEmail,
      grade_level: input.gradeLevel,
    })
    .eq("id", id)
    .select(STUDENT_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to change this student.");
  }
  return toStudentSummary(data);
}

export async function deleteStudent(id: number): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .delete()
    .eq("id", id)
    .eq("counts_as_student", true)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to remove this student.");
  }
}
