export function bulletinPath(orgSlug: string, courseId: number, bulletinId: number): string {
  return `/my/${orgSlug}/courses/${courseId}/bulletins/${bulletinId}`;
}

export function newBulletinPath(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}/bulletins/new`;
}

export function bulletinEditPath(
  orgSlug: string,
  courseId: number,
  bulletinId: number,
): string {
  return `${bulletinPath(orgSlug, courseId, bulletinId)}/edit`;
}
