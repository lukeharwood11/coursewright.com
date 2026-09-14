export function courseSearchHref(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}`;
}

export function materialSearchHref(args: {
  orgSlug: string;
  courseId: number;
  materialId: number;
  unitId: number | null;
}): string {
  const { orgSlug, courseId, materialId, unitId } = args;
  if (unitId != null) {
    return `/my/${orgSlug}/courses/${courseId}/units/${unitId}/materials/${materialId}`;
  }
  return `/my/${orgSlug}/courses/${courseId}/materials/${materialId}`;
}
