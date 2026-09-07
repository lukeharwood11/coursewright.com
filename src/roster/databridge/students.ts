import { requireSupabase } from "./client";

export type StudentSummary = {
  id: number;
  organizationId: number;
  name: string;
  gradeLevel: string | null;
};

export const studentQueryKeys = {
  list: (orgId: number) => ["students", "list", orgId] as const,
  detail: (id: number) => ["students", "detail", id] as const,
};

export async function listStudents(
  organizationId: number,
): Promise<StudentSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select("id, organization_id, name, grade_level")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map(toStudentSummary);
}

export async function getStudent(id: number): Promise<StudentSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select("id, organization_id, name, grade_level")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toStudentSummary(data);
}

function toStudentSummary(row: {
  id: number;
  organization_id: number;
  name: string;
  grade_level: string | null;
}): StudentSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    gradeLevel: row.grade_level,
  };
}
