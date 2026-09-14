import type { CourseCatalogMeta, CourseSummary } from "@/courses/databridge/courses";
import { isCoursePublished } from "@/courses/model/visibility";
import type { CalendarWeek } from "@/parent/model/thisWeek";
import { isInCalendarWeek } from "@/parent/model/thisWeek";

export const STAFF_COURSE_PREVIEW_LIMIT = 6;

export type StaffAttentionKind =
  | "no_enrollments"
  | "unpublished_with_roster"
  | "no_dated_this_week";

export type StaffAttentionItem = {
  id: string;
  kind: StaffAttentionKind;
  courseId: number;
  courseTitle: string;
  message: string;
};

export type StaffWeekCourse = {
  courseId: number;
  courseTitle: string;
  datedMaterialCount: number;
};

export type StaffImportantNowItem = {
  id: number;
  materialId: number;
  materialTitle: string;
  materialDescription: string;
  courseId: number;
  courseTitle: string;
  unitId: number | null;
};

export type StaffPeopleCounts = {
  studentCount: number;
  classCount: number;
};

export type StaffDashboardMaterial = {
  id: number;
  title: string;
  scheduledDate: string | null;
  courseId: number;
  unitId: number | null;
  unitStart: string | null;
  unitEnd: string | null;
};

export type StaffDashboardSource = {
  week: CalendarWeek;
  courses: CourseSummary[];
  catalogByCourseId: Record<number, CourseCatalogMeta>;
  materials: StaffDashboardMaterial[];
  importantNow: StaffImportantNowItem[];
  people: StaffPeopleCounts;
};

export type StaffDashboard = {
  week: CalendarWeek;
  courses: CourseSummary[];
  catalogByCourseId: Record<number, CourseCatalogMeta>;
  previewCourses: CourseSummary[];
  hasMoreCourses: boolean;
  attention: StaffAttentionItem[];
  weekByCourse: StaffWeekCourse[];
  datedMaterialTotal: number;
  importantNow: StaffImportantNowItem[];
  people: StaffPeopleCounts;
  setup: {
    needsCourse: boolean;
    needsStudents: boolean;
  };
};

function enrollmentCount(
  catalogByCourseId: Record<number, CourseCatalogMeta>,
  courseId: number,
): number {
  return catalogByCourseId[courseId]?.activeEnrollmentCount ?? 0;
}

export function buildStaffDashboard(source: StaffDashboardSource): StaffDashboard {
  const datedCounts = new Map<number, number>();
  for (const course of source.courses) {
    datedCounts.set(course.id, 0);
  }
  for (const material of source.materials) {
    if (
      !isInCalendarWeek(
        source.week,
        material.scheduledDate,
        material.unitStart,
        material.unitEnd,
      )
    ) {
      continue;
    }
    datedCounts.set(
      material.courseId,
      (datedCounts.get(material.courseId) ?? 0) + 1,
    );
  }

  const attention: StaffAttentionItem[] = [];
  for (const course of source.courses) {
    if (course.status !== "active") continue;
    const enrolled = enrollmentCount(source.catalogByCourseId, course.id);
    if (enrolled === 0) {
      attention.push({
        id: `no_enrollments-${course.id}`,
        kind: "no_enrollments",
        courseId: course.id,
        courseTitle: course.title,
        message: `${course.title} has no students enrolled`,
      });
    }
    if (!isCoursePublished(course.visibility) && enrolled > 0) {
      attention.push({
        id: `unpublished_with_roster-${course.id}`,
        kind: "unpublished_with_roster",
        courseId: course.id,
        courseTitle: course.title,
        message: `${course.title} is unpublished but has enrolled students`,
      });
    }
    if (enrolled > 0 && (datedCounts.get(course.id) ?? 0) === 0) {
      attention.push({
        id: `no_dated_this_week-${course.id}`,
        kind: "no_dated_this_week",
        courseId: course.id,
        courseTitle: course.title,
        message: `${course.title} has no dated materials this week`,
      });
    }
  }

  const weekByCourse = source.courses
    .filter((course) => course.status === "active")
    .map((course) => ({
      courseId: course.id,
      courseTitle: course.title,
      datedMaterialCount: datedCounts.get(course.id) ?? 0,
    }))
    .filter((row) => row.datedMaterialCount > 0)
    .sort((a, b) => b.datedMaterialCount - a.datedMaterialCount);

  const datedMaterialTotal = weekByCourse.reduce(
    (sum, row) => sum + row.datedMaterialCount,
    0,
  );

  const courseIds = new Set(source.courses.map((course) => course.id));
  const importantNow = source.importantNow.filter((item) =>
    courseIds.has(item.courseId),
  );

  return {
    week: source.week,
    courses: source.courses,
    catalogByCourseId: source.catalogByCourseId,
    previewCourses: source.courses.slice(0, STAFF_COURSE_PREVIEW_LIMIT),
    hasMoreCourses: source.courses.length > STAFF_COURSE_PREVIEW_LIMIT,
    attention,
    weekByCourse,
    datedMaterialTotal,
    importantNow,
    people: source.people,
    setup: {
      needsCourse: source.courses.length === 0,
      needsStudents: source.people.studentCount === 0,
    },
  };
}

export function peopleCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural}`;
}
