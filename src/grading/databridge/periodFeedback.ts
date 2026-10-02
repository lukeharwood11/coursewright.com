import type { FamilyPeriodFeedback } from "@/grading/model/periodFeedback";
import { requireSupabase } from "./client";

export const periodFeedbackQueryKeys = {
  course: (courseId: number, cycleId: number) =>
    ["period-feedback", courseId, cycleId] as const,
  student: (studentId: number) => ["period-feedback", "student", studentId] as const,
};

export type PeriodFeedbackRow = {
  id: number;
  studentId: number;
  body: string;
};

export async function listCoursePeriodFeedback(
  courseId: number,
  fillCycleId: number,
): Promise<PeriodFeedbackRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_period_feedback")
    .select("id, student_profile_id, body")
    .eq("course_id", courseId)
    .eq("fill_cycle_id", fillCycleId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as { id: number; student_profile_id: number; body: string }[]).map(
    (row) => ({
      id: row.id,
      studentId: row.student_profile_id,
      body: row.body,
    }),
  );
}

export async function savePeriodFeedback(input: {
  organizationId: number;
  courseId: number;
  fillCycleId: number;
  studentId: number;
  body: string | null;
  existingId: number | null;
}): Promise<void> {
  const db = requireSupabase();
  if (input.body == null) {
    if (input.existingId == null) return;
    const { error } = await db.from("course_period_feedback").delete().eq("id", input.existingId);
    if (error) throw new Error(error.message);
    return;
  }
  if (input.existingId != null) {
    const { error } = await db
      .from("course_period_feedback")
      .update({ body: input.body })
      .eq("id", input.existingId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db.from("course_period_feedback").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    fill_cycle_id: input.fillCycleId,
    student_profile_id: input.studentId,
    body: input.body,
  });
  if (error) throw new Error(error.message);
}

export async function listFamilyPeriodFeedback(studentId: number): Promise<FamilyPeriodFeedback[]> {
  const db = requireSupabase();
  // Fill-cycle rows are staff-only. Embedding them returns a null label for parents
  // and the comment disappears. The function copies the label without that SELECT.
  const { data, error } = await db.rpc("family_period_feedback", {
    p_student_profile_id: studentId,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as {
    body: string;
    course_id: number;
    course_title: string;
    fill_cycle_id: number;
    cycle_label: string;
  }[]).map((row) => ({
    courseId: row.course_id,
    courseTitle: row.course_title,
    cycleId: row.fill_cycle_id,
    cycleLabel: row.cycle_label,
    body: row.body,
  }));
}
