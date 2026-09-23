import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";

export const gradebookQueryKeys = {
  course: (courseId: number) => ["gradebook", courseId] as const,
  student: (studentId: number) => ["student-grades", studentId] as const,
  attempt: (attemptId: number) => ["gradebook-attempt", attemptId] as const,
};

export type GradebookItem = {
  quizId: number;
  attemptId: number;
  title: string;
  locked: boolean;
  earned: number | null;
  possible: number | null;
  percent: number | null;
};

export type GradebookRow = {
  enrollmentId: number;
  studentProfileId: number;
  studentName: string;
  status: string;
  items: GradebookItem[];
  finalPercent: number | null;
  overrideLabel: string | null;
  overrideNote: string | null;
  overriddenAt: string | null;
  overriddenByName: string | null;
};

export type StudentCourseGrade = {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  items: GradebookItem[];
  finalPercent: number | null;
  overrideLabel: string | null;
  overrideNote: string | null;
  overriddenAt: string | null;
  overriddenByName: string | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asItem(value: Json): GradebookItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const quizId = asNumber(value.quiz_id);
  const attemptId = asNumber(value.attempt_id);
  if (quizId == null || attemptId == null) return null;
  return {
    quizId,
    attemptId,
    title: typeof value.title === "string" ? value.title : "Quiz",
    locked: value.locked === true,
    earned: asNumber(value.earned),
    possible: asNumber(value.possible),
    percent: asNumber(value.percent),
  };
}

function asItems(value: Json | undefined): GradebookItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = asItem(item);
    return parsed ? [parsed] : [];
  });
}

export async function listCourseQuizzes(
  courseId: number,
): Promise<Array<{ id: number; title: string }>> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quizzes")
    .select("id, title")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("title");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadCourseGradebook(courseId: number): Promise<GradebookRow[]> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("course_gradebook", { p_course_id: courseId });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const rows = data.rows;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const enrollmentId = asNumber(row.enrollment_id);
    const studentProfileId = asNumber(row.student_profile_id);
    if (enrollmentId == null || studentProfileId == null) return [];
    return [
      {
        enrollmentId,
        studentProfileId,
        studentName: typeof row.student_name === "string" ? row.student_name : "Student",
        status: typeof row.status === "string" ? row.status : "active",
        items: asItems(row.items),
        finalPercent: asNumber(row.final_percent),
        overrideLabel: typeof row.override_label === "string" ? row.override_label : null,
        overrideNote: typeof row.override_note === "string" ? row.override_note : null,
        overriddenAt: typeof row.overridden_at === "string" ? row.overridden_at : null,
        overriddenByName:
          typeof row.overridden_by_name === "string" ? row.overridden_by_name : null,
      },
    ];
  });
}

export async function loadStudentCourseGrades(
  studentProfileId: number,
): Promise<StudentCourseGrade[]> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("student_course_grades", {
    p_student_profile_id: studentProfileId,
  });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const enrollmentId = asNumber(row.enrollment_id);
    const courseId = asNumber(row.course_id);
    if (enrollmentId == null || courseId == null) return [];
    return [
      {
        enrollmentId,
        courseId,
        courseTitle: typeof row.course_title === "string" ? row.course_title : "Course",
        items: asItems(row.items),
        finalPercent: asNumber(row.final_percent),
        overrideLabel: typeof row.override_label === "string" ? row.override_label : null,
        overrideNote: typeof row.override_note === "string" ? row.override_note : null,
        overriddenAt: typeof row.overridden_at === "string" ? row.overridden_at : null,
        overriddenByName:
          typeof row.overridden_by_name === "string" ? row.overridden_by_name : null,
      },
    ];
  });
}

export async function setCourseFinalOverride(args: {
  enrollmentId: number;
  label: string | null;
  note: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("set_course_final_override", {
    p_enrollment_id: args.enrollmentId,
    p_label: args.label,
    p_note: args.note,
  });
  if (error) throw new Error(error.message);
}

export type AttemptAnswerDraft = {
  questionId: number;
  prompt: string;
  possible: number;
  autoPoints: number | null;
  teacherPoints: number | null;
};

export async function listAttemptAnswerDrafts(
  attemptId: number,
): Promise<AttemptAnswerDraft[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("quiz_attempt_answers")
    .select("question_id, prompt_snapshot, points_possible, auto_points, teacher_points")
    .eq("attempt_id", attemptId)
    .order("question_id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    questionId: row.question_id,
    prompt: row.prompt_snapshot,
    possible: row.points_possible ?? 0,
    autoPoints: row.auto_points,
    teacherPoints: row.teacher_points,
  }));
}

export async function saveAssignmentGrade(args: {
  attemptId: number;
  points: { questionId: number; points: number }[];
  note: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("grade_quiz_attempt_noted", {
    p_attempt_id: args.attemptId,
    p_points: args.points,
    p_note: args.note,
  });
  if (error) throw new Error(error.message);
}
