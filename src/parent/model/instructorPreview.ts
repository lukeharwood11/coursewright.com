import type { ParentDashboardSource } from "./dashboard";
import type { CalendarWeek } from "./thisWeek";

/** Synthetic student id for staff Preview mode (not a real profile). */
export const INSTRUCTOR_PREVIEW_STUDENT_ID = -1;

export type TaughtCourseRow = {
  id: number;
  title: string;
  status: string;
  colorKey: string | null;
};

/**
 * Build a ParentDashboardSource as if one student were enrolled in the
 * instructor's taught + published courses.
 */
export function buildInstructorPreviewSource(input: {
  week: CalendarWeek;
  today: string;
  studentName: string;
  courses: TaughtCourseRow[];
  materials: ParentDashboardSource["materials"];
  importantNow: ParentDashboardSource["importantNow"];
  lessonPlans: NonNullable<ParentDashboardSource["lessonPlans"]>;
  announcements: NonNullable<ParentDashboardSource["announcements"]>;
  events: NonNullable<ParentDashboardSource["events"]>;
}): ParentDashboardSource {
  const enrollments = input.courses.map((course) => ({
    studentId: INSTRUCTOR_PREVIEW_STUDENT_ID,
    courseId: course.id,
    courseTitle: course.title,
    courseStatus: course.status,
    colorKey: course.colorKey,
  }));

  return {
    week: input.week,
    today: input.today,
    students: [
      {
        id: INSTRUCTOR_PREVIEW_STUDENT_ID,
        name: input.studentName,
        gradeLevel: null,
      },
    ],
    enrollments,
    materials: input.materials,
    importantNow: input.importantNow,
    lessonPlans: input.lessonPlans,
    classMemberships: [],
    announcements: input.announcements,
    events: input.events,
  };
}
