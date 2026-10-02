export type FillAudience = "organization" | "classes" | "courses";
export type FillCycleStatus = "open" | "closed";
export type FillDependency = "grades" | "attendance" | "outcomes" | "period_feedback";

export type FillCycle = {
  id: number;
  label: string;
  dueOn: string;
  audience: FillAudience;
  status: FillCycleStatus;
  requireGrades: boolean;
  requireAttendance: boolean;
  requireOutcomes: boolean;
  requirePeriodFeedback: boolean;
  classIds: number[];
  courseIds: number[];
};

export type FillCourse = { id: number; title: string; status: string };
export type FillClass = { id: number; title: string };

export type FillSubmission = {
  cycleId: number;
  kind: FillDependency;
  courseId: number | null;
  classId: number | null;
};

export type PackageSlot = {
  cycleId: number;
  kind: FillDependency;
  courseId: number | null;
  classId: number | null;
  title: string;
  submitted: boolean;
};

export function isSoftPastDue(dueOn: string, today: string): boolean {
  return dueOn < today;
}

export function localDateStamp(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function validateFillCycleDraft(input: {
  label: string;
  dueOn: string;
  audience: FillAudience;
  classIds: number[];
  courseIds: number[];
  requireGrades: boolean;
  requireAttendance: boolean;
  requireOutcomes: boolean;
}): string | null {
  const label = input.label.trim().replace(/\s+/g, " ");
  if (!label) return "Name this fill cycle.";
  if (label.length > 80) return "Use 80 characters or fewer.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueOn)) return "Choose a due date.";
  if (input.audience === "classes" && input.classIds.length === 0) {
    return "Choose at least one class.";
  }
  if (input.audience === "courses" && input.courseIds.length === 0) {
    return "Choose at least one course.";
  }
  if (!input.requireGrades && !input.requireAttendance && !input.requireOutcomes) {
    return "Choose at least one package.";
  }
  return null;
}

export function packageSlots(input: {
  cycle: FillCycle;
  courses: readonly FillCourse[];
  classes: readonly FillClass[];
  classCourseIds: ReadonlyMap<number, readonly number[]>;
  coursesWithOutcomes: ReadonlySet<number>;
  submissions: readonly FillSubmission[];
  /** When set, these ids already respect audience and what this person may count. */
  visibleCourseIds?: ReadonlySet<number>;
  visibleClassIds?: ReadonlySet<number>;
}): PackageSlot[] {
  const courses = input.visibleCourseIds
    ? input.courses.filter(
        (course) => course.status === "active" && input.visibleCourseIds?.has(course.id),
      )
    : scopedCourses(input);
  const classes = input.visibleClassIds
    ? input.classes.filter((classGroup) => input.visibleClassIds?.has(classGroup.id))
    : scopedClasses(input);
  const slots: PackageSlot[] = [];

  for (const course of courses) {
    if (input.cycle.requireGrades) {
      slots.push(slot(input, "grades", course.id, null, course.title));
    }
    if (input.cycle.requireOutcomes && input.coursesWithOutcomes.has(course.id)) {
      slots.push(slot(input, "outcomes", course.id, null, course.title));
    }
    if (input.cycle.requirePeriodFeedback) {
      slots.push(slot(input, "period_feedback", course.id, null, course.title));
    }
    if (input.cycle.requireAttendance && input.cycle.audience !== "classes") {
      slots.push(slot(input, "attendance", course.id, null, course.title));
    }
  }

  if (input.cycle.requireAttendance && input.cycle.audience !== "courses") {
    for (const classGroup of classes) {
      slots.push(slot(input, "attendance", null, classGroup.id, classGroup.title));
    }
  }

  return slots;
}

export function tasksForUser(
  slots: readonly PackageSlot[],
  input: { courseIds: ReadonlySet<number>; classIds: ReadonlySet<number> },
): PackageSlot[] {
  return slots.filter((item) => {
    if (item.submitted) return false;
    if (item.courseId != null) return input.courseIds.has(item.courseId);
    if (item.classId != null) return input.classIds.has(item.classId);
    return false;
  });
}

export function rollup(slots: readonly PackageSlot[]): { finished: number; total: number } {
  const total = slots.length;
  const finished = slots.filter((item) => item.submitted).length;
  return { finished, total };
}

export function fillTaskPath(
  orgSlug: string,
  slot: PackageSlot,
): string {
  const cycle = `cycle=${slot.cycleId}`;
  if (slot.kind === "grades" && slot.courseId != null) {
    return `/my/${orgSlug}/courses/${slot.courseId}/gradebook?${cycle}`;
  }
  if (slot.kind === "outcomes" && slot.courseId != null) {
    return `/my/${orgSlug}/courses/${slot.courseId}/outcomes/ratings?${cycle}`;
  }
  if (slot.kind === "period_feedback" && slot.courseId != null) {
    return `/my/${orgSlug}/courses/${slot.courseId}/period-feedback?${cycle}`;
  }
  if (slot.kind === "attendance" && slot.courseId != null) {
    return `/my/${orgSlug}/courses/${slot.courseId}/attendance?${cycle}`;
  }
  if (slot.kind === "attendance" && slot.classId != null) {
    return `/my/${orgSlug}/classes/${slot.classId}/attendance?${cycle}`;
  }
  return `/my/${orgSlug}/fill-cycles/${slot.cycleId}`;
}

export type FillScopeRow = {
  cycleId: number;
  courseId: number | null;
  classId: number | null;
};

/** Slots this person may count, using `fill_cycle_scope` rows for the cycle. */
export function slotsForCycle(input: {
  cycle: FillCycle;
  courses: readonly FillCourse[];
  classes: readonly FillClass[];
  coursesWithOutcomes: ReadonlySet<number>;
  submissions: readonly FillSubmission[];
  scope: readonly FillScopeRow[];
}): PackageSlot[] {
  const visibleCourseIds = new Set<number>();
  const visibleClassIds = new Set<number>();
  for (const row of input.scope) {
    if (row.cycleId !== input.cycle.id) continue;
    if (row.courseId != null) visibleCourseIds.add(row.courseId);
    if (row.classId != null) visibleClassIds.add(row.classId);
  }
  return packageSlots({
    cycle: input.cycle,
    courses: input.courses,
    classes: input.classes,
    classCourseIds: new Map(),
    coursesWithOutcomes: input.coursesWithOutcomes,
    submissions: input.submissions,
    visibleCourseIds,
    visibleClassIds,
  });
}

export function reminderRecipients(input: {
  slots: readonly PackageSlot[];
  courseInstructors: readonly { courseId: number; userId: string }[];
  classLeaders: readonly { classId: number; userId: string }[];
}): string[] {
  const ids = new Set<string>();
  for (const slot of input.slots) {
    if (slot.submitted) continue;
    if (slot.courseId != null) {
      for (const row of input.courseInstructors) {
        if (row.courseId === slot.courseId) ids.add(row.userId);
      }
    }
    if (slot.classId != null) {
      for (const row of input.classLeaders) {
        if (row.classId === slot.classId) ids.add(row.userId);
      }
    }
  }
  return [...ids];
}

export function dependencyLabel(kind: FillDependency): string {
  if (kind === "grades") return "Grades";
  if (kind === "attendance") return "Attendance";
  if (kind === "outcomes") return "Outcomes";
  return "Period feedback";
}

function scopedCourses(input: {
  cycle: FillCycle;
  courses: readonly FillCourse[];
  classCourseIds: ReadonlyMap<number, readonly number[]>;
}): FillCourse[] {
  const active = input.courses.filter((course) => course.status === "active");
  if (input.cycle.audience === "organization") return active;
  if (input.cycle.audience === "courses") {
    const ids = new Set(input.cycle.courseIds);
    return active.filter((course) => ids.has(course.id));
  }
  const ids = new Set<number>();
  for (const classId of input.cycle.classIds) {
    for (const courseId of input.classCourseIds.get(classId) ?? []) ids.add(courseId);
  }
  return active.filter((course) => ids.has(course.id));
}

function scopedClasses(input: {
  cycle: FillCycle;
  classes: readonly FillClass[];
}): FillClass[] {
  if (input.cycle.audience === "courses") return [];
  if (input.cycle.audience === "organization") return input.classes.slice();
  const ids = new Set(input.cycle.classIds);
  return input.classes.filter((classGroup) => ids.has(classGroup.id));
}

function slot(
  input: { cycle: FillCycle; submissions: readonly FillSubmission[] },
  kind: FillDependency,
  courseId: number | null,
  classId: number | null,
  title: string,
): PackageSlot {
  const submitted = input.submissions.some(
    (row) =>
      row.cycleId === input.cycle.id &&
      row.kind === kind &&
      row.courseId === courseId &&
      row.classId === classId,
  );
  return { cycleId: input.cycle.id, kind, courseId, classId, title, submitted };
}
