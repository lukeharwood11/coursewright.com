export const COURSE_STATUSES = ["active", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export function parseCourseStatus(value: string): CourseStatus {
  return value === "archived" ? "archived" : "active";
}

export function courseStatusLabel(status: CourseStatus): string {
  return status === "active" ? "Active" : "Archived";
}
