import { Link } from "react-router-dom";
import {
  BookmarkIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { courseColorCssVar, type CourseColorKey } from "@/courses/model/courseColor";
import { materialPath } from "@/materials/model/paths";
import { quizPath } from "@/quizzes/model/paths";
import type { CalendarChipKind } from "@/calendar/model/events";

export function materialChipDisplayTitle(
  title: string,
  kind: CalendarChipKind | "both" | "plain",
): string {
  if (kind === "due" || kind === "both") return `Due: ${title}`;
  return title;
}

export function MaterialChip({
  orgSlug,
  courseId,
  unitId,
  materialId,
  title,
  kind,
  colorKey,
  unpublished,
  itemKind = "material",
  withIcon = false,
}: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  materialId: number;
  title: string;
  kind: CalendarChipKind | "both" | "plain";
  colorKey: CourseColorKey;
  unpublished?: boolean;
  itemKind?: "material" | "quiz";
  /** Day view: icon cue for assigned vs due vs plan material. */
  withIcon?: boolean;
}) {
  const color = courseColorCssVar(colorKey);
  const filled = kind === "due" || kind === "both";
  const outlined = kind === "assigned" || kind === "both" || kind === "plain";
  const Icon =
    kind === "due" || kind === "both"
      ? ClockIcon
      : kind === "assigned"
        ? BookmarkIcon
        : DocumentTextIcon;
  const displayTitle = materialChipDisplayTitle(title, kind);
  const kindLabel =
    kind === "due" ? "Due" : kind === "assigned" ? "Assigned" : kind === "both" ? "Assigned · Due" : null;
  const href =
    itemKind === "quiz"
      ? quizPath({ orgSlug, courseId, unitId, quizId: materialId })
      : materialPath({ orgSlug, courseId, unitId, materialId });

  return (
    <Link
      to={href}
      className={
        withIcon
          ? "flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-bold leading-snug"
          : "block truncate rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-bold leading-snug"
      }
      style={{
        color: filled ? "#fff" : color,
        background: filled ? color : "transparent",
        border: outlined ? `1.5px solid ${color}` : "1.5px solid transparent",
      }}
      title={unpublished ? `${displayTitle} · draft` : displayTitle}
    >
      {withIcon ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
      ) : null}
      <span className="min-w-0 truncate">
        {displayTitle}
        {unpublished ? " · draft" : ""}
      </span>
      {withIcon && kindLabel ? (
        <span className="sr-only">{kindLabel}</span>
      ) : null}
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
