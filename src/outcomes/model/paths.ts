export function courseOutcomesPath(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}/outcomes`;
}

export function orgOutcomesSettingsPath(orgSlug: string): string {
  return `/my/${orgSlug}/settings?tab=outcomes`;
}
