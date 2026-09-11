export function coursesPath(orgSlug: string): string {
  return `/my/${orgSlug}/courses`;
}

export function coursePath(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}`;
}

export function courseSettingsPath(orgSlug: string, courseId: number): string {
  return `${coursePath(orgSlug, courseId)}/settings`;
}

export function courseRosterPath(orgSlug: string, courseId: number): string {
  return `${coursePath(orgSlug, courseId)}/roster`;
}

export function newCoursePath(orgSlug: string): string {
  return `${coursesPath(orgSlug)}?new=1`;
}

export function newCourseFromPath(orgSlug: string, sourceCourseId: number): string {
  return `${coursesPath(orgSlug)}?new=1&from=${sourceCourseId}`;
}
