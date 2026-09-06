import type { CalendarWeek } from "./thisWeek";
import { isInCalendarWeek } from "./thisWeek";

export type ParentDashboardMaterial = {
  id: string;
  title: string;
  scheduledDate: string | null;
};

export type ParentDashboardCourse = {
  id: string;
  title: string;
  materials: ParentDashboardMaterial[];
};

export type ParentDashboardStudent = {
  id: string;
  name: string;
  gradeLevel: string | null;
  hasActiveEnrollment: boolean;
  courses: ParentDashboardCourse[];
};

export type ParentImportantNowItem = {
  id: string;
  materialId: string;
  materialTitle: string;
  courseTitle: string;
};

export type ParentDashboard = {
  week: CalendarWeek;
  importantNow: ParentImportantNowItem[];
  students: ParentDashboardStudent[];
  hasActiveEnrollment: boolean;
};

export type ParentDashboardSource = {
  week: CalendarWeek;
  students: Array<{ id: string; name: string; gradeLevel: string | null }>;
  enrollments: Array<{
    studentId: string;
    courseId: string;
    courseTitle: string;
    courseStatus: string;
  }>;
  materials: Array<{
    id: string;
    title: string;
    scheduledDate: string | null;
    courseId: string;
    unitStart: string | null;
    unitEnd: string | null;
  }>;
  importantNow: Array<{
    id: string;
    materialId: string;
    materialTitle: string;
    courseId: string;
    courseTitle: string;
  }>;
};

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

  return {
    week: source.week,
    importantNow,
    students,
    hasActiveEnrollment: students.some((student) => student.hasActiveEnrollment),
  };
}
