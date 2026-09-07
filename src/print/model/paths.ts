export function printThisWeekPath(orgSlug: string): string {
  return `/my/${orgSlug}/print-this-week`;
}

export type PrintGrainKind = "material" | "unit" | "thisWeek";

export function printBackPath(input: {
  grain: PrintGrainKind | null;
  orgSlug: string;
  courseId: number | null;
  unitId: number | null;
  materialId: number | null;
}): string {
  if (input.grain === "material" && input.courseId && input.materialId) {
    const nested = input.unitId
      ? `/my/${input.orgSlug}/courses/${input.courseId}/units/${input.unitId}/materials/${input.materialId}`
      : `/my/${input.orgSlug}/courses/${input.courseId}/materials/${input.materialId}`;
    return nested;
  }
  if (input.grain === "unit" && input.courseId && input.unitId) {
    return `/my/${input.orgSlug}/courses/${input.courseId}/units/${input.unitId}`;
  }
  return `/my/${input.orgSlug}`;
}

export function printFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "print"}.pdf`;
}
