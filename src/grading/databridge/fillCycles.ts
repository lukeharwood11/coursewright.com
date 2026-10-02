import type {
  FillAudience,
  FillClass,
  FillCourse,
  FillCycle,
  FillCycleStatus,
  FillDependency,
  FillScopeRow,
  FillSubmission,
} from "@/grading/model/fillCycle";
import { requireSupabase } from "./client";

export const fillCycleQueryKeys = {
  all: ["fill-cycles"] as const,
  workspace: (organizationId: number) => ["fill-cycles", "workspace", organizationId] as const,
  detail: (cycleId: number) => ["fill-cycles", "detail", cycleId] as const,
};

type CycleRow = {
  id: number;
  label: string;
  due_on: string;
  audience: FillAudience;
  status: FillCycleStatus;
  require_grades: boolean;
  require_attendance: boolean;
  require_outcomes: boolean;
  require_period_feedback: boolean;
  class_ids: { class_id: number }[] | null;
  course_ids: { course_id: number }[] | null;
};

export type FillWorkspace = {
  cycles: FillCycle[];
  courses: FillCourse[];
  classes: FillClass[];
  courseInstructors: { courseId: number; userId: string }[];
  classLeaders: { classId: number; userId: string }[];
  submissions: FillSubmission[];
  coursesWithOutcomes: number[];
  scope: FillScopeRow[];
  people: { userId: string; name: string }[];
  reminders: { id: number; cycleId: number; recipientUserId: string; createdAt: string }[];
};

function toCycle(row: CycleRow): FillCycle {
  return {
    id: row.id,
    label: row.label,
    dueOn: row.due_on,
    audience: row.audience,
    status: row.status,
    requireGrades: row.require_grades,
    requireAttendance: row.require_attendance,
    requireOutcomes: row.require_outcomes,
    requirePeriodFeedback: row.require_period_feedback,
    classIds: (row.class_ids ?? []).map((link) => link.class_id),
    courseIds: (row.course_ids ?? []).map((link) => link.course_id),
  };
}

export async function loadFillWorkspace(organizationId: number): Promise<FillWorkspace> {
  const db = requireSupabase();
  const [cyclesRes, coursesRes, classesRes, submissionsRes, outcomesRes, peopleRes, remindersRes, scopeRes] =
    await Promise.all([
      db
        .from("report_card_fill_cycles")
        .select(
          "id, label, due_on, audience, status, require_grades, require_attendance, require_outcomes, require_period_feedback, class_ids:report_card_fill_cycle_classes(class_id), course_ids:report_card_fill_cycle_courses(course_id)",
        )
        .eq("organization_id", organizationId)
        .order("due_on"),
      db.from("courses").select("id, title, status").eq("organization_id", organizationId),
      db
        .from("classes")
        .select("id, title")
        .eq("organization_id", organizationId)
        .is("deleted_at", null),
      db
        .from("report_card_fill_submissions")
        .select("cycle_id, dependency_kind, course_id, class_id")
        .eq("organization_id", organizationId),
      db
        .from("course_outcomes")
        .select("course_id")
        .eq("organization_id", organizationId)
        .is("archived_at", null),
      db.from("org_profiles").select("user_id, name").eq("organization_id", organizationId),
      db
        .from("report_card_fill_reminders")
        .select("id, cycle_id, recipient_user_id, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      db.rpc("fill_cycle_scope", { p_organization_id: organizationId }),
    ]);

  for (const result of [
    cyclesRes,
    coursesRes,
    classesRes,
    submissionsRes,
    outcomesRes,
    peopleRes,
    remindersRes,
    scopeRes,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const instructorRes = await db
    .from("course_instructors")
    .select("course_id, user_id")
    .in(
      "course_id",
      ((coursesRes.data ?? []) as { id: number }[]).map((course) => course.id).concat([-1]),
    );
  if (instructorRes.error) throw new Error(instructorRes.error.message);

  const leaderRes = await db
    .from("class_leaders")
    .select("class_id, user_id")
    .in(
      "class_id",
      ((classesRes.data ?? []) as { id: number }[]).map((classGroup) => classGroup.id).concat([-1]),
    );
  if (leaderRes.error) throw new Error(leaderRes.error.message);

  return {
    cycles: ((cyclesRes.data ?? []) as CycleRow[]).map(toCycle),
    courses: (coursesRes.data ?? []) as FillCourse[],
    classes: (classesRes.data ?? []) as FillClass[],
    courseInstructors: ((instructorRes.data ?? []) as { course_id: number; user_id: string | null }[])
      .filter((row) => row.user_id)
      .map((row) => ({ courseId: row.course_id, userId: row.user_id as string })),
    classLeaders: ((leaderRes.data ?? []) as { class_id: number; user_id: string }[]).map((row) => ({
      classId: row.class_id,
      userId: row.user_id,
    })),
    submissions: ((submissionsRes.data ?? []) as {
      cycle_id: number;
      dependency_kind: FillDependency;
      course_id: number | null;
      class_id: number | null;
    }[]).map((row) => ({
      cycleId: row.cycle_id,
      kind: row.dependency_kind,
      courseId: row.course_id,
      classId: row.class_id,
    })),
    coursesWithOutcomes: [
      ...new Set(((outcomesRes.data ?? []) as { course_id: number }[]).map((row) => row.course_id)),
    ],
    scope: ((scopeRes.data ?? []) as {
      cycle_id: number;
      course_id: number | null;
      class_id: number | null;
    }[]).map((row) => ({
      cycleId: row.cycle_id,
      courseId: row.course_id,
      classId: row.class_id,
    })),
    people: ((peopleRes.data ?? []) as { user_id: string | null; name: string }[])
      .filter((person) => person.user_id)
      .map((person) => ({ userId: person.user_id as string, name: person.name })),
    reminders: ((remindersRes.data ?? []) as {
      id: number;
      cycle_id: number;
      recipient_user_id: string;
      created_at: string;
    }[]).map((row) => ({
      id: row.id,
      cycleId: row.cycle_id,
      recipientUserId: row.recipient_user_id,
      createdAt: row.created_at,
    })),
  };
}

export async function getFillCycle(cycleId: number): Promise<FillCycle | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_fill_cycles")
    .select(
      "id, label, due_on, audience, status, require_grades, require_attendance, require_outcomes, require_period_feedback, class_ids:report_card_fill_cycle_classes(class_id), course_ids:report_card_fill_cycle_courses(course_id)",
    )
    .eq("id", cycleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toCycle(data as CycleRow);
}

export async function fillPackageSubmitted(input: {
  cycleId: number;
  kind: FillDependency;
  courseId: number | null;
  classId: number | null;
}): Promise<boolean> {
  const db = requireSupabase();
  let query = db
    .from("report_card_fill_submissions")
    .select("id")
    .eq("cycle_id", input.cycleId)
    .eq("dependency_kind", input.kind);
  query = input.courseId == null ? query.is("course_id", null) : query.eq("course_id", input.courseId);
  query = input.classId == null ? query.is("class_id", null) : query.eq("class_id", input.classId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data != null;
}

export async function createFillCycle(input: {
  organizationId: number;
  label: string;
  dueOn: string;
  audience: FillAudience;
  classIds: number[];
  courseIds: number[];
  requireGrades: boolean;
  requireAttendance: boolean;
  requireOutcomes: boolean;
}): Promise<number> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_fill_cycles")
    .insert({
      organization_id: input.organizationId,
      label: input.label,
      due_on: input.dueOn,
      audience: input.audience,
      require_grades: input.requireGrades,
      require_attendance: input.requireAttendance,
      require_outcomes: input.requireOutcomes,
      require_period_feedback: false,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const cycleId = data.id;
  if (input.audience === "classes" && input.classIds.length > 0) {
    const { error: classError } = await db.from("report_card_fill_cycle_classes").insert(
      input.classIds.map((classId) => ({ cycle_id: cycleId, class_id: classId })),
    );
    if (classError) throw new Error(classError.message);
  }
  if (input.audience === "courses" && input.courseIds.length > 0) {
    const { error: courseError } = await db.from("report_card_fill_cycle_courses").insert(
      input.courseIds.map((courseId) => ({ cycle_id: cycleId, course_id: courseId })),
    );
    if (courseError) throw new Error(courseError.message);
  }
  return cycleId;
}

export async function setFillCycleStatus(cycleId: number, status: FillCycleStatus): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("report_card_fill_cycles").update({ status }).eq("id", cycleId);
  if (error) throw new Error(error.message);
}

export async function submitFillPackage(input: {
  organizationId: number;
  cycleId: number;
  kind: FillDependency;
  courseId: number | null;
  classId: number | null;
}): Promise<void> {
  const db = requireSupabase();
  let query = db
    .from("report_card_fill_submissions")
    .select("id")
    .eq("cycle_id", input.cycleId)
    .eq("dependency_kind", input.kind);
  query = input.courseId == null ? query.is("course_id", null) : query.eq("course_id", input.courseId);
  query = input.classId == null ? query.is("class_id", null) : query.eq("class_id", input.classId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    const { error: updateError } = await db
      .from("report_card_fill_submissions")
      .update({ submitted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);
    return;
  }
  const { error: insertError } = await db.from("report_card_fill_submissions").insert({
    organization_id: input.organizationId,
    cycle_id: input.cycleId,
    dependency_kind: input.kind,
    course_id: input.courseId,
    class_id: input.classId,
  });
  if (insertError) throw new Error(insertError.message);
}

export async function remindFillStaff(input: {
  organizationId: number;
  cycleId: number;
  recipientUserIds: string[];
}): Promise<void> {
  const db = requireSupabase();
  if (input.recipientUserIds.length === 0) return;
  const { error } = await db.from("report_card_fill_reminders").insert(
    input.recipientUserIds.map((recipientUserId) => ({
      organization_id: input.organizationId,
      cycle_id: input.cycleId,
      recipient_user_id: recipientUserId,
    })),
  );
  if (error) throw new Error(error.message);
}
