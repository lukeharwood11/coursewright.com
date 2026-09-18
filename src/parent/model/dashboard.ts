import type { CalendarWeek } from "./thisWeek";
import { isInCalendarWeek } from "./thisWeek";

export type ParentDashboardMaterial = {
  id: number;
  title: string;
  scheduledDate: string | null;
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

export type ParentDashboard = {
  week: CalendarWeek;
  importantNow: ParentImportantNowItem[];
  students: ParentDashboardStudent[];
  hasActiveEnrollment: boolean;
};

export type ParentDashboardSource = {
  week: CalendarWeek;
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

  return {
    week: source.week,
    importantNow,
    students,
    hasActiveEnrollment: students.some((student) => student.hasActiveEnrollment),
  };
}
