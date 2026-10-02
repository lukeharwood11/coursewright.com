import {
  sortedCriteria,
  type CourseOutcome,
  type OutcomeCriterion,
  type RatingOption,
} from "@/outcomes/model/outcomes";
import { requireSupabase } from "./client";

export const outcomeQueryKeys = {
  all: ["outcomes"] as const,
  ratingOptions: (organizationId: number) =>
    ["outcomes", "rating-options", organizationId] as const,
  course: (courseId: number) => ["outcomes", "course", courseId] as const,
};

type RatingRow = {
  id: number;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type CriterionRow = {
  id: number;
  outcome_id: number;
  statement: string;
  sort_order: number;
};

type OutcomeRow = {
  id: number;
  course_id: number;
  statement: string;
  sort_order: number;
  archived_at: string | null;
  criteria: CriterionRow[] | CriterionRow | null;
};

function asList<T>(value: T[] | T | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toCriterion(row: CriterionRow): OutcomeCriterion {
  return {
    id: row.id,
    outcomeId: row.outcome_id,
    statement: row.statement,
    sortOrder: row.sort_order,
  };
}

function toOutcome(row: OutcomeRow): CourseOutcome {
  return {
    id: row.id,
    courseId: row.course_id,
    statement: row.statement,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    criteria: sortedCriteria(asList(row.criteria).map(toCriterion)),
  };
}

export async function listRatingOptions(organizationId: number): Promise<RatingOption[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("outcome_rating_options")
    .select("id, label, sort_order, is_active")
    .eq("organization_id", organizationId)
    .order("sort_order")
    .order("id");
  if (error) throw new Error(error.message);
  return ((data ?? []) as RatingRow[]).map((row) => ({
    id: row.id,
    label: row.label,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }));
}

export async function insertRatingOption(input: {
  organizationId: number;
  label: string;
  sortOrder: number;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("outcome_rating_options").insert({
    organization_id: input.organizationId,
    label: input.label,
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function updateRatingOption(input: {
  id: number;
  label?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<void> {
  const db = requireSupabase();
  const patch: {
    label?: string;
    sort_order?: number;
    is_active?: boolean;
  } = {};
  if (input.label != null) patch.label = input.label;
  if (input.sortOrder != null) patch.sort_order = input.sortOrder;
  if (input.isActive != null) patch.is_active = input.isActive;
  const { error } = await db.from("outcome_rating_options").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteRatingOption(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("outcome_rating_options").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listCourseOutcomes(courseId: number): Promise<CourseOutcome[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_outcomes")
    .select(
      "id, course_id, statement, sort_order, archived_at, criteria:course_outcome_criteria(id, outcome_id, statement, sort_order)",
    )
    .eq("course_id", courseId)
    .order("sort_order")
    .order("id")
    .order("sort_order", { referencedTable: "course_outcome_criteria" })
    .order("id", { referencedTable: "course_outcome_criteria" });
  if (error) throw new Error(error.message);
  return ((data ?? []) as OutcomeRow[]).map(toOutcome);
}

export async function insertCourseOutcome(input: {
  organizationId: number;
  courseId: number;
  statement: string;
  sortOrder: number;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("course_outcomes").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    statement: input.statement,
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function updateCourseOutcome(input: {
  id: number;
  statement?: string;
  sortOrder?: number;
  archivedAt?: string | null;
}): Promise<void> {
  const db = requireSupabase();
  const patch: {
    statement?: string;
    sort_order?: number;
    archived_at?: string | null;
  } = {};
  if (input.statement != null) patch.statement = input.statement;
  if (input.sortOrder != null) patch.sort_order = input.sortOrder;
  if (input.archivedAt !== undefined) patch.archived_at = input.archivedAt;
  const { error } = await db.from("course_outcomes").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function insertCriterion(input: {
  outcomeId: number;
  statement: string;
  sortOrder: number;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("course_outcome_criteria").insert({
    outcome_id: input.outcomeId,
    statement: input.statement,
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function updateCriterion(input: {
  id: number;
  statement?: string;
  sortOrder?: number;
}): Promise<void> {
  const db = requireSupabase();
  const patch: { statement?: string; sort_order?: number } = {};
  if (input.statement != null) patch.statement = input.statement;
  if (input.sortOrder != null) patch.sort_order = input.sortOrder;
  const { error } = await db.from("course_outcome_criteria").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteCriterion(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("course_outcome_criteria").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
