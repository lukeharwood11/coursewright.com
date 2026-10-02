export function courseOutcomesPath(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}/outcomes`;
}

export function courseOutcomeRatingsPath(orgSlug: string, courseId: number): string {
  return `${courseOutcomesPath(orgSlug, courseId)}/ratings`;
}

export function orgOutcomesSettingsPath(orgSlug: string): string {
  return `/my/${orgSlug}/settings?tab=outcomes`;
}
