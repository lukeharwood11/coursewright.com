import { requireSupabase } from "./client";

export type ImportantNowRecord = {
  id: number;
  courseId: number;
  materialId: number;
};

export const importantNowQueryKeys = {
  course: (courseId: number) => ["important-now", "course", courseId] as const,
};

export async function listImportantNowForCourse(
  courseId: number,
): Promise<ImportantNowRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("important_now")
    .select("id, course_id, material_id")
    .eq("course_id", courseId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    courseId: row.course_id,
    materialId: row.material_id,
  }));
}

export async function setImportantNow(args: {
  organizationId: number;
  courseId: number;
  materialId: number;
  createdBy: string;
  flagged: boolean;
}): Promise<void> {
  const db = requireSupabase();
  if (args.flagged) {
    const { error } = await db.from("important_now").insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      material_id: args.materialId,
      created_by: args.createdBy,
    });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await db
    .from("important_now")
    .delete()
    .eq("course_id", args.courseId)
    .eq("material_id", args.materialId);
  if (error) throw new Error(error.message);
}
