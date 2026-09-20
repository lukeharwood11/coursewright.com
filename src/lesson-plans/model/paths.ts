export function lessonPlanPath(
  orgSlug: string,
  courseId: number,
  lessonPlanId: number,
): string {
  return `/my/${orgSlug}/courses/${courseId}/lesson-plans/${lessonPlanId}`;
}

export function newLessonPlanPath(
  orgSlug: string,
  courseId: number,
  weekStart?: string,
): string {
  const base = `/my/${orgSlug}/courses/${courseId}/lesson-plans/new`;
  return weekStart ? `${base}?week=${weekStart}` : base;
}

export function lessonPlanEditPath(
  orgSlug: string,
  courseId: number,
  lessonPlanId: number,
): string {
  return `${lessonPlanPath(orgSlug, courseId, lessonPlanId)}/edit`;
}
