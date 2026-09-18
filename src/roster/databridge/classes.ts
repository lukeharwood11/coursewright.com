import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import type { ValidatedClass } from "@/roster/model/classGroup";
import { requireSupabase } from "./client";
import type { StudentSummary } from "./students";

export type ClassSummary = {
  id: number;
  organizationId: number;
  title: string;
};

export type ClassMember = {
  id: number;
  classId: number;
  student: StudentSummary;
};

export const classQueryKeys = {
  list: (orgId: number) => ["classes", "list", orgId] as const,
  detail: (id: number) => ["classes", "detail", id] as const,
  members: (id: number) => ["classes", "members", id] as const,
  forStudent: (studentId: number) => ["classes", "student", studentId] as const,
};

type ClassRow = {
  id: number;
  organization_id: number;
  title: string;
};

function toClassSummary(row: ClassRow): ClassSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
  };
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listClasses(
  organizationId: number,
): Promise<ClassSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("classes")
    .select("id, organization_id, title")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toClassSummary(row));
}

export async function getClass(id: number): Promise<ClassSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("classes")
    .select("id, organization_id, title")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toClassSummary(data);
}

export async function createClass(
  organizationId: number,
  input: ValidatedClass,
): Promise<ClassSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("classes")
    .insert({
      organization_id: organizationId,
      title: input.title,
    })
    .select("id, organization_id, title")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to create a class.");
  }
  return toClassSummary(data);
}

export async function listClassMembers(classId: number): Promise<ClassMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .select(
      "id, class_id, student:student_profiles(id, organization_id, name, grade_level, parent_email, student_email)",
    )
    .eq("class_id", classId)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const student = unwrapOne(row.student);
    if (!student) return [];
    return [
      {
        id: row.id,
        classId: row.class_id,
        student: {
          id: student.id,
          organizationId: student.organization_id,
          name: student.name,
          gradeLevel: student.grade_level,
          parentEmail: student.parent_email,
          studentEmail: student.student_email,
        },
      },
    ];
  });
}

export async function listClassesForStudent(
  studentProfileId: number,
): Promise<ClassSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .select("class:classes(id, organization_id, title, deleted_at)")
    .eq("student_profile_id", studentProfileId);

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const classRow = unwrapOne(row.class);
    if (!classRow || classRow.deleted_at) return [];
    return [toClassSummary(classRow)];
  });
}

export async function addClassMember(
  classId: number,
  studentProfileId: number,
): Promise<void> {
  await addClassMembers(classId, [studentProfileId]);
}

export async function addClassMembers(
  classId: number,
  studentProfileIds: number[],
): Promise<void> {
  const uniqueIds = [
    ...new Set(studentProfileIds.filter((id) => Number.isFinite(id) && id > 0)),
  ];
  if (uniqueIds.length === 0) return;

  const db = requireSupabase();
  const { data: existingRows, error: existingError } = await db
    .from("class_members")
    .select("student_profile_id")
    .eq("class_id", classId)
    .in("student_profile_id", uniqueIds);

  if (existingError) throw new Error(rosterWriteErrorMessage(existingError));

  const already = new Set(
    (existingRows ?? []).map((row) => row.student_profile_id),
  );
  const toInsert = uniqueIds.filter((id) => !already.has(id));
  if (toInsert.length === 0) return;

  const { error } = await db.from("class_members").insert(
    toInsert.map((studentProfileId) => ({
      class_id: classId,
      student_profile_id: studentProfileId,
    })),
  );

  if (error) throw new Error(rosterWriteErrorMessage(error));
}

export async function removeClassMember(memberId: number): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("class_members")
    .delete()
    .eq("id", memberId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to remove this student.");
  }
}
