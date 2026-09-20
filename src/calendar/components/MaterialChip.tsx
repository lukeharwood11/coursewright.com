import { Link } from "react-router-dom";
import { courseColorCssVar, type CourseColorKey } from "@/courses/model/courseColor";
import { materialPath } from "@/materials/model/paths";
import type { CalendarChipKind } from "@/calendar/model/events";

export function MaterialChip({
  orgSlug,
  courseId,
  unitId,
  materialId,
  title,
  kind,
  colorKey,
  unpublished,
}: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  materialId: number;
  title: string;
  kind: CalendarChipKind | "both" | "plain";
  colorKey: CourseColorKey;
  unpublished?: boolean;
}) {
  const color = courseColorCssVar(colorKey);
  const filled = kind === "due" || kind === "both";
  const outlined = kind === "assigned" || kind === "both" || kind === "plain";

  return (
    <Link
      to={materialPath({ orgSlug, courseId, unitId, materialId })}
      className="block truncate rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-bold leading-snug"
      style={{
        color: filled ? "#fff" : color,
        background: filled ? color : "transparent",
        border: outlined ? `1.5px solid ${color}` : "1.5px solid transparent",
      }}
      title={`${title}${kind === "due" ? " · Due" : kind === "assigned" ? " · Assigned" : ""}`}
    >
      {title}
      {unpublished ? " · draft" : ""}
    </Link>
  );
}

export function chipKind(
  assigned: boolean,
  due: boolean,
): CalendarChipKind | "both" | "plain" {
  if (assigned && due) return "both";
  if (due) return "due";
  if (assigned) return "assigned";
  return "plain";
}
