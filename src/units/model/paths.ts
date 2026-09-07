export function unitPath(
  orgSlug: string,
  courseId: number,
  unitId: number,
): string {
  return `/my/${orgSlug}/courses/${courseId}/units/${unitId}`;
}

export function unitPrintPath(
  orgSlug: string,
  courseId: number,
  unitId: number,
): string {
  return `${unitPath(orgSlug, courseId, unitId)}/print`;
}
