import type { FamilyRatingRow, SavedRating } from "@/outcomes/model/outcomes";
import { requireSupabase } from "./client";
import { outcomeQueryKeys } from "./outcomes";

export const ratingQueryKeys = {
  matrix: (courseId: number) => [...outcomeQueryKeys.course(courseId), "ratings"] as const,
  package: (courseId: number) => [...outcomeQueryKeys.course(courseId), "package"] as const,
  student: (studentId: number) => ["outcomes", "student", studentId] as const,
};

type RatingRow = {
  id: number;
  student_profile_id: number;
  outcome_id: number;
  criterion_id: number | null;
  rating_option_id: number | null;
};

export type OutcomePackage = {
  id: number;
  submittedAt: string;
};

function toSaved(row: RatingRow): SavedRating {
  return {
    id: row.id,
    studentId: row.student_profile_id,
    outcomeId: row.outcome_id,
    criterionId: row.criterion_id,
    ratingOptionId: row.rating_option_id,
  };
}

export async function listCourseRatings(
  courseId: number,
  fillCycleId: number | null,
): Promise<SavedRating[]> {
  const db = requireSupabase();
  let query = db
    .from("course_outcome_ratings")
    .select("id, student_profile_id, outcome_id, criterion_id, rating_option_id")
    .eq("course_id", courseId);
  query = fillCycleId == null ? query.is("fill_cycle_id", null) : query.eq("fill_cycle_id", fillCycleId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as RatingRow[]).map(toSaved);
}

export async function listOutcomePackage(
  courseId: number,
  fillCycleId: number | null,
): Promise<OutcomePackage | null> {
  const db = requireSupabase();
  let query = db
    .from("course_outcome_packages")
    .select("id, submitted_at")
    .eq("course_id", courseId);
  query = fillCycleId == null ? query.is("fill_cycle_id", null) : query.eq("fill_cycle_id", fillCycleId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { id: data.id, submittedAt: data.submitted_at };
}

export async function saveRatingCell(input: {
  organizationId: number;
  courseId: number;
  studentId: number;
  outcomeId: number;
  criterionId: number | null;
  ratingOptionId: number | null;
  existingId: number | null;
  fillCycleId: number | null;
}): Promise<void> {
  const db = requireSupabase();
  if (input.ratingOptionId == null) {
    if (input.existingId == null) return;
    const { error } = await db.from("course_outcome_ratings").delete().eq("id", input.existingId);
    if (error) throw new Error(error.message);
    return;
  }
  if (input.existingId != null) {
    const { error } = await db
      .from("course_outcome_ratings")
      .update({ rating_option_id: input.ratingOptionId })
      .eq("id", input.existingId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db.from("course_outcome_ratings").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    student_profile_id: input.studentId,
    outcome_id: input.outcomeId,
    criterion_id: input.criterionId,
    rating_option_id: input.ratingOptionId,
    fill_cycle_id: input.fillCycleId,
  });
  if (error) throw new Error(error.message);
}

export async function submitOutcomePackage(input: {
  organizationId: number;
  courseId: number;
  existingId: number | null;
  fillCycleId: number | null;
}): Promise<void> {
  const db = requireSupabase();
  if (input.existingId != null) {
    const { error } = await db
      .from("course_outcome_packages")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", input.existingId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await db.from("course_outcome_packages").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    fill_cycle_id: input.fillCycleId,
  });
  if (error) throw new Error(error.message);
}

type FamilyRow = {
  course_id: number;
  outcome: { statement: string } | { statement: string }[] | null;
  criterion: { statement: string } | { statement: string }[] | null;
  option: { label: string } | { label: string }[] | null;
  course: { title: string } | { title: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listFamilyOutcomeRatings(studentId: number): Promise<FamilyRatingRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_outcome_ratings")
    .select(
      "course_id, outcome:course_outcomes(statement), criterion:course_outcome_criteria(statement), option:outcome_rating_options(label), course:courses(title)",
    )
    .eq("student_profile_id", studentId)
    .not("rating_option_id", "is", null);
  if (error) throw new Error(error.message);
  const rows: FamilyRatingRow[] = [];
  for (const row of (data ?? []) as FamilyRow[]) {
    const outcome = one(row.outcome);
    const option = one(row.option);
    const course = one(row.course);
    if (!outcome || !option || !course) continue;
    const criterion = one(row.criterion);
    rows.push({
      courseId: row.course_id,
      courseTitle: course.title,
      outcomeStatement: outcome.statement,
      criterionStatement: criterion?.statement ?? null,
      label: option.label,
    });
  }
  return rows;
}
