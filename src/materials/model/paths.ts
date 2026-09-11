export function materialPath(args: {
  orgSlug: string;
  courseId: number;
  unitId?: number | null;
  materialId: number;
  suffix?: "edit" | "print" | null;
}): string {
  const nested = args.unitId
    ? `/my/${args.orgSlug}/courses/${args.courseId}/units/${args.unitId}/materials/${args.materialId}`
    : `/my/${args.orgSlug}/courses/${args.courseId}/materials/${args.materialId}`;
  if (args.suffix === "edit") return `${nested}/edit`;
  if (args.suffix === "print") return `${nested}/print`;
  return nested;
}

export function materialEditPath(args: {
  orgSlug: string;
  courseId: number;
  unitId?: number | null;
  materialId: number;
}): string {
  return materialPath({ ...args, suffix: "edit" });
}

export function materialPrintPath(args: {
  orgSlug: string;
  courseId: number;
  unitId?: number | null;
  materialId: number;
}): string {
  return materialPath({ ...args, suffix: "print" });
}
