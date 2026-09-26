import { requireSupabase } from "./client";
import { parseCourseColorKey, type CourseColorKey } from "@/courses/model/courseColor";
import { listEventsOverlapping, type EventSummary } from "@/events/databridge/events";
import { eventAppliesToFamily } from "@/events/model/audience";
import { listLessonPlansInRange, type LessonPlanDetail } from "@/lesson-plans/databridge/lessonPlans";
import { isPublished } from "@/materials/model/visibility";
import { familyVisibleMaterials } from "@/app/layouts/model/viewMode";
import type { StaffViewMode } from "@/app/layouts/model/viewMode";
import {
  listTaughtPublishedCourses,
  loadFamilyStudentIds,
  loadLinkedParentStudentIds,
  loadOwnStudentProfileIds,
} from "@/parent/databridge/dashboard";
import { quizDueDate } from "@/quizzes/model/window";

export type CalendarSourceMaterial = {
  id: number;
  title: string;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  scheduledDate: string | null;
  dueDate: string | null;
  unitId: number | null;
  unitStart: string | null;
  unitEnd: string | null;
  unpublished: boolean;
};

export type CalendarSourceQuiz = {
  id: number;
  title: string;
  courseId: number;
  courseTitle: string;
  colorKey: CourseColorKey;
  dueDate: string | null;
  unitId: number | null;
  unpublished: boolean;
};

export type CalendarSource = {
  courses: Array<{ id: number; title: string; colorKey: CourseColorKey }>;
  materials: CalendarSourceMaterial[];
  quizzes: CalendarSourceQuiz[];
  lessonPlans: LessonPlanDetail[];
  events: EventSummary[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const calendarQueryKeys = {
  range: (
    organizationId: number,
    userId: string,
    start: string,
    end: string,
    parentMode: boolean,
    staffViewMode: StaffViewMode = "teacher",
  ) =>
    ["calendar", organizationId, userId, start, end, parentMode, staffViewMode] as const,
};

export async function loadCalendarSource(args: {
  organizationId: number;
  userId: string;
  rangeStart: string;
  rangeEnd: string;
  parentMode: boolean;
  /** When parentMode and this is a staff writer mode, scopes family vs preview data. */
  staffViewMode?: StaffViewMode;
}): Promise<CalendarSource> {
  const db = requireSupabase();
  const [lessonPlans, events] = await Promise.all([
    listLessonPlansInRange(args.organizationId, args.rangeStart, args.rangeEnd),
    listEventsOverlapping(args.organizationId, args.rangeStart, args.rangeEnd),
  ]);

  if (args.parentMode) {
    const parent = await loadParentCalendar(db, args, lessonPlans);
    const classIds = await linkedClassIds(db, parent.studentIds, args.organizationId);
    const courseIds = new Set(parent.courses.map((course) => course.id));
    return {
      courses: parent.courses,
      materials: parent.materials,
      quizzes: parent.quizzes,
      lessonPlans: parent.lessonPlans,
      events: events.filter((event) => eventAppliesToFamily(event, courseIds, classIds)),
    };
  }
  return { ...(await loadStaffCalendar(db, args, lessonPlans)), events };
}

async function linkedClassIds(
  db: ReturnType<typeof requireSupabase>,
  studentIds: number[],
  organizationId: number,
): Promise<Set<number>> {
  if (studentIds.length === 0) return new Set();

  const { data: members, error: membersError } = await db
    .from("class_members")
    .select("class_id")
    .in("student_profile_id", studentIds);
  if (membersError) throw new Error(membersError.message);
  const classIds = [...new Set((members ?? []).map((row) => row.class_id))];
  if (classIds.length === 0) return new Set();

  const { data: classes, error: classError } = await db
    .from("classes")
    .select("id")
    .in("id", classIds)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  if (classError) throw new Error(classError.message);
  return new Set((classes ?? []).map((row) => row.id));
}

async function loadStaffCalendar(
  db: ReturnType<typeof requireSupabase>,
  args: { organizationId: number; rangeStart: string; rangeEnd: string },
  lessonPlans: LessonPlanDetail[],
): Promise<CalendarSource> {
  const { data: courseRows, error: courseError } = await db
    .from("courses")
    .select("id, title, color_key, status")
    .eq("organization_id", args.organizationId)
    .eq("status", "active")
    .order("title");
  if (courseError) throw new Error(courseError.message);

  const courses = (courseRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    colorKey: parseCourseColorKey(row.color_key),
  }));
  const courseIds = courses.map((course) => course.id);
  const courseById = new Map(courses.map((course) => [course.id, course]));

  let materials: CalendarSourceMaterial[] = [];
  let quizzes: CalendarSourceQuiz[] = [];
  if (courseIds.length > 0) {
    const { data, error } = await db
      .from("materials")
      .select(
        "id, title, scheduled_date, due_date, course_id, status, deleted_at, visibility, unit:units(id, start_date, end_date)",
      )
      .in("course_id", courseIds)
      .is("deleted_at", null)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    materials = (data ?? []).flatMap((row) => {
      if (!row.course_id) return [];
      const course = courseById.get(row.course_id);
      if (!course) return [];
      const unit = one(row.unit);
      return [
        {
          id: row.id,
          title: row.title,
          courseId: row.course_id,
          courseTitle: course.title,
          colorKey: course.colorKey,
          scheduledDate: row.scheduled_date,
          dueDate: row.due_date,
          unitId: unit?.id ?? null,
          unitStart: unit?.start_date ?? null,
          unitEnd: unit?.end_date ?? null,
          unpublished: row.visibility !== "published",
        },
      ];
    });

    const { data: quizRows, error: quizError } = await db
      .from("quizzes")
      .select(
        "id, title, accepts_from, accepts_until, accepts_timezone, course_id, unit_id, deleted_at, visibility",
      )
      .in("course_id", courseIds)
      .is("deleted_at", null);
    if (quizError) throw new Error(quizError.message);
    quizzes = (quizRows ?? []).flatMap((row) => {
      const course = courseById.get(row.course_id);
      if (!course) return [];
      return [
        {
          id: row.id,
          title: row.title,
          courseId: row.course_id,
          courseTitle: course.title,
          colorKey: course.colorKey,
          dueDate: quizDueDate(row.accepts_until, row.accepts_timezone),
          unitId: row.unit_id,
          unpublished: row.visibility !== "published",
        },
      ];
    });
  }

  return { courses, materials, quizzes, lessonPlans, events: [] };
}

async function loadParentCalendar(
  db: ReturnType<typeof requireSupabase>,
  args: {
    organizationId: number;
    userId: string;
    rangeStart: string;
    rangeEnd: string;
    staffViewMode?: StaffViewMode;
  },
  lessonPlans: LessonPlanDetail[],
): Promise<CalendarSource & { studentIds: number[] }> {
  const mode = args.staffViewMode ?? "teacher";

  if (mode === "preview") {
    const taught = await listTaughtPublishedCourses(args.organizationId, args.userId);
    return loadPublishedCoursesCalendar(
      db,
      taught.map((course) => ({
        id: course.id,
        title: course.title,
        colorKey: parseCourseColorKey(course.colorKey),
      })),
      lessonPlans,
      [],
    );
  }

  const studentIds =
    mode === "parent"
      ? await loadLinkedParentStudentIds(args.userId)
      : mode === "student"
        ? await loadOwnStudentProfileIds(args.organizationId, args.userId)
        : await loadFamilyStudentIds(args.organizationId, args.userId);

  if (studentIds.length === 0) {
    return { courses: [], materials: [], quizzes: [], lessonPlans: [], events: [], studentIds: [] };
  }

  const { data: enrollmentRows, error: enrollmentError } = await db
    .from("enrollments")
    .select("course:courses(id, title, color_key, status, visibility, organization_id)")
    .eq("status", "active")
    .in("student_profile_id", studentIds);
  if (enrollmentError) throw new Error(enrollmentError.message);

  const courses = (enrollmentRows ?? []).flatMap((row) => {
    const course = one(row.course);
    if (!course || course.organization_id !== args.organizationId) return [];
    if (course.status !== "active" || course.visibility !== "published") return [];
    return [
      {
        id: course.id,
        title: course.title,
        colorKey: parseCourseColorKey(course.color_key),
      },
    ];
  });
  const uniqueCourses = [...new Map(courses.map((course) => [course.id, course])).values()];
  return loadPublishedCoursesCalendar(db, uniqueCourses, lessonPlans, studentIds);
}

async function loadPublishedCoursesCalendar(
  db: ReturnType<typeof requireSupabase>,
  courses: Array<{ id: number; title: string; colorKey: CourseColorKey }>,
  lessonPlans: LessonPlanDetail[],
  studentIds: number[],
): Promise<CalendarSource & { studentIds: number[] }> {
  const courseIds = courses.map((course) => course.id);
  const courseById = new Map(courses.map((course) => [course.id, course]));

  let materials: CalendarSourceMaterial[] = [];
  let quizzes: CalendarSourceQuiz[] = [];
  if (courseIds.length > 0) {
    const { data, error } = await db
      .from("materials")
      .select(
        "id, title, scheduled_date, due_date, course_id, status, deleted_at, visibility, unit:units(id, start_date, end_date)",
      )
      .in("course_id", courseIds)
      .is("deleted_at", null)
      .eq("status", "active")
      .eq("visibility", "published");
    if (error) throw new Error(error.message);
    materials = (data ?? []).flatMap((row) => {
      if (!row.course_id) return [];
      const course = courseById.get(row.course_id);
      if (!course) return [];
      const unit = one(row.unit);
      return [
        {
          id: row.id,
          title: row.title,
          courseId: row.course_id,
          courseTitle: course.title,
          colorKey: course.colorKey,
          scheduledDate: row.scheduled_date,
          dueDate: row.due_date,
          unitId: unit?.id ?? null,
          unitStart: unit?.start_date ?? null,
          unitEnd: unit?.end_date ?? null,
          unpublished: false,
        },
      ];
    });

    const { data: quizRows, error: quizError } = await db
      .from("quizzes")
      .select(
        "id, title, accepts_from, accepts_until, accepts_timezone, course_id, unit_id, deleted_at, visibility",
      )
      .in("course_id", courseIds)
      .is("deleted_at", null)
      .eq("visibility", "published");
    if (quizError) throw new Error(quizError.message);
    quizzes = (quizRows ?? []).flatMap((row) => {
      const course = courseById.get(row.course_id);
      if (!course) return [];
      return [
        {
          id: row.id,
          title: row.title,
          courseId: row.course_id,
          courseTitle: course.title,
          colorKey: course.colorKey,
          dueDate: quizDueDate(row.accepts_until, row.accepts_timezone),
          unitId: row.unit_id,
          unpublished: false,
        },
      ];
    });
  }

  const publishedPlans = lessonPlans
    .filter((plan) => isPublished(plan.visibility) && courseIds.includes(plan.courseId))
    .map((plan) => ({
      ...plan,
      days: plan.days.map((day) => ({
        ...day,
        materials: familyVisibleMaterials(day.materials),
      })),
    }));

  return {
    courses,
    materials,
    quizzes,
    lessonPlans: publishedPlans,
    events: [],
    studentIds,
  };
}
