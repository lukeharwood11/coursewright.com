import type { CalendarWeek } from "./thisWeek";
import { isInCalendarWeek, localIsoDate } from "./thisWeek";

export type ParentDashboardMaterial = {
  id: number;
  title: string;
  scheduledDate: string | null;
  dueDate: string | null;
  unitId: number | null;
};

export type ParentDashboardCourse = {
  id: number;
  title: string;
  materials: ParentDashboardMaterial[];
};

export type ParentDashboardStudent = {
  id: number;
  name: string;
  gradeLevel: string | null;
  hasActiveEnrollment: boolean;
  courses: ParentDashboardCourse[];
};

export type ParentImportantNowItem = {
  id: number;
  materialId: number;
  materialTitle: string;
  materialDescription: string;
  courseId: number;
  courseTitle: string;
  unitId: number | null;
};

export type ParentDashboardUpNext = {
  studentId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  material: ParentDashboardMaterial;
  effectiveDate: string;
};

export type ParentDashboard = {
  week: CalendarWeek;
  importantNow: ParentImportantNowItem[];
  students: ParentDashboardStudent[];
  upcoming: ParentDashboardUpNext[];
  upNext: ParentDashboardUpNext | null;
  hasActiveEnrollment: boolean;
};

export type ParentDashboardSource = {
  week: CalendarWeek;
  today: string;
  students: Array<{ id: number; name: string; gradeLevel: string | null }>;
  enrollments: Array<{
    studentId: number;
    courseId: number;
    courseTitle: string;
    courseStatus: string;
  }>;
  materials: Array<{
    id: number;
    title: string;
    scheduledDate: string | null;
    dueDate: string | null;
    courseId: number;
    unitId: number | null;
    unitStart: string | null;
    unitEnd: string | null;
  }>;
  importantNow: Array<{
    id: number;
    materialId: number;
    materialTitle: string;
    materialDescription: string;
    courseId: number;
    courseTitle: string;
    unitId: number | null;
  }>;
};

export function materialEffectiveDate(
  scheduledDate: string | null,
  unitStart: string | null,
  unitEnd: string | null,
): string | null {
  if (scheduledDate) return scheduledDate;
  if (unitStart && unitEnd) return unitStart;
  return null;
}

export function buildParentDashboard(source: ParentDashboardSource): ParentDashboard {
  const activeCourseIds = new Set(
    source.enrollments
      .filter((row) => row.courseStatus === "active")
      .map((row) => row.courseId),
  );

  const students = source.students.map((student) => {
    const studentEnrollments = source.enrollments.filter(
      (row) => row.studentId === student.id && row.courseStatus === "active",
    );
    const courses = studentEnrollments.map((enrollment) => {
      const materials = source.materials
        .filter(
          (material) =>
            material.courseId === enrollment.courseId &&
            isInCalendarWeek(
              source.week,
              material.scheduledDate,
              material.unitStart,
              material.unitEnd,
            ),
        )
        .map((material) => ({
          id: material.id,
          title: material.title,
          scheduledDate: material.scheduledDate,
          dueDate: material.dueDate,
          unitId: material.unitId,
        }));
      return {
        id: enrollment.courseId,
        title: enrollment.courseTitle,
        materials,
      };
    });
    return {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      hasActiveEnrollment: studentEnrollments.length > 0,
      courses,
    };
  });

  const importantNow = source.importantNow.filter((item) =>
    activeCourseIds.has(item.courseId),
  );

  const upcoming = collectUpcoming(source);
  return {
    week: source.week,
    importantNow,
    students,
    upcoming,
    upNext: upcoming[0] ?? null,
    hasActiveEnrollment: students.some((student) => student.hasActiveEnrollment),
  };
}

export function filterParentDashboard(
  dashboard: ParentDashboard,
  activeStudentIds: number[],
): ParentDashboard {
  const allowed = new Set(activeStudentIds);
  const students = dashboard.students.filter((student) => allowed.has(student.id));
  const courseIds = new Set(
    students.flatMap((student) => student.courses.map((course) => course.id)),
  );
  const importantNow = dashboard.importantNow.filter((item) =>
    courseIds.has(item.courseId),
  );
  const upcoming = dashboard.upcoming.filter((item) => allowed.has(item.studentId));
  return {
    ...dashboard,
    students,
    importantNow,
    upcoming,
    upNext: upcoming[0] ?? null,
    hasActiveEnrollment: students.some((student) => student.hasActiveEnrollment),
  };
}

export function toggleStudentId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function collectUpcoming(source: ParentDashboardSource): ParentDashboardUpNext[] {
  const today = source.today || localIsoDate();
  const items: ParentDashboardUpNext[] = [];

  for (const student of source.students) {
    const enrollments = source.enrollments.filter(
      (row) => row.studentId === student.id && row.courseStatus === "active",
    );
    for (const enrollment of enrollments) {
      for (const material of source.materials) {
        if (material.courseId !== enrollment.courseId) continue;
        const effectiveDate = materialEffectiveDate(
          material.scheduledDate,
          material.unitStart,
          material.unitEnd,
        );
        if (!effectiveDate || effectiveDate < today) continue;
        items.push({
          studentId: student.id,
          studentName: student.name,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle,
          effectiveDate,
          material: {
            id: material.id,
            title: material.title,
            scheduledDate: material.scheduledDate,
            dueDate: material.dueDate,
            unitId: material.unitId,
          },
        });
      }
    }
  }

  items.sort((a, b) => {
    if (a.effectiveDate !== b.effectiveDate) {
      return a.effectiveDate.localeCompare(b.effectiveDate);
    }
    if (a.studentName !== b.studentName) {
      return a.studentName.localeCompare(b.studentName);
    }
    return a.material.title.localeCompare(b.material.title);
  });

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.studentId}:${item.material.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
