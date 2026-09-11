import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import type { ValidatedStudentProfile } from "@/roster/model/studentProfile";
import { requireSupabase } from "./client";

export type StudentSummary = {
  id: number;
  organizationId: number;
  name: string;
  gradeLevel: string | null;
  parentEmail: string | null;
};

export const studentQueryKeys = {
  list: (orgId: number) => ["students", "list", orgId] as const,
  detail: (id: number) => ["students", "detail", id] as const,
};

type StudentRow = {
  id: number;
  organization_id: number;
  name: string;
  grade_level: string | null;
  parent_email: string | null;
};

function toStudentSummary(row: StudentRow): StudentSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    gradeLevel: row.grade_level,
    parentEmail: row.parent_email,
  };
}

const STUDENT_COLUMNS = "id, organization_id, name, grade_level, parent_email";

export async function listStudents(
  organizationId: number,
): Promise<StudentSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select(STUDENT_COLUMNS)
    .eq("organization_id", organizationId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toStudentSummary(row));
}

export async function getStudent(id: number): Promise<StudentSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select(STUDENT_COLUMNS)
    .eq("id", id)
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
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .insert({
      organization_id: organizationId,
      name: input.name,
      parent_email: input.parentEmail,
      grade_level: input.gradeLevel,
      created_via_course_id: createdViaCourseId ?? null,
    })
    .select(STUDENT_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to add a student.");
  }
  return toStudentSummary(data);
}

export async function updateStudent(
  id: number,
  input: ValidatedStudentProfile,
): Promise<StudentSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .update({
      name: input.name,
      parent_email: input.parentEmail,
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
