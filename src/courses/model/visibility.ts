export const COURSE_VISIBILITIES = ["published", "unpublished"] as const;
export type CourseVisibility = (typeof COURSE_VISIBILITIES)[number];

export function parseCourseVisibility(value: string): CourseVisibility {
  return value === "published" ? "published" : "unpublished";
}

export function isCoursePublished(visibility: CourseVisibility): boolean {
  return visibility === "published";
}
