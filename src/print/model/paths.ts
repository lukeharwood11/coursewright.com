export function printThisWeekPath(orgSlug: string, studentIds?: number[]): string {
  const path = `/my/${orgSlug}/print-this-week`;
  if (!studentIds || studentIds.length === 0) return path;
  return `${path}?students=${studentIds.join(",")}`;
}

export function parsePrintStudentIds(search: string): number[] | null {
  const raw = new URLSearchParams(search).get("students");
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  return ids;
}

export type PrintGrainKind = "material" | "unit" | "thisWeek" | "resource";

export function printBackPath(input: {
  grain: PrintGrainKind | null;
  orgSlug: string;
  courseId: number | null;
  unitId: number | null;
  materialId: number | null;
  itemId?: number | null;
}): string {
  if (input.grain === "resource" && input.itemId) {
    return `/my/${input.orgSlug}/resources/items/${input.itemId}`;
  }
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
