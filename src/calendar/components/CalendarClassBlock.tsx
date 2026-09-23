import { Link } from "react-router-dom";
import { courseColorCssVar } from "@/courses/model/courseColor";
import { lessonPlanPath } from "@/lesson-plans/model/paths";
import type { WeekClassCard } from "@/calendar/model/events";
import { chipKind, MaterialChip } from "./MaterialChip";

export function CalendarClassBlock({
  orgSlug,
  card,
  withIcons = false,
}: {
  orgSlug: string;
  card: WeekClassCard;
  /** Day view: icons on material rows to tell assigned vs due vs plan items apart. */
  withIcons?: boolean;
}) {
  const courseLabel = (
    <>
      {card.courseTitle}
      {card.unpublished ? " · draft" : ""}
    </>
  );
  const courseStyle = { color: courseColorCssVar(card.colorKey) };

  return (
    <div>
      {card.planId != null ? (
        <Link
          to={lessonPlanPath(orgSlug, card.courseId, card.planId)}
          className="relative z-10 block text-[11.5px] font-extrabold"
          style={courseStyle}
        >
          {courseLabel}
        </Link>
      ) : (
        <p className="text-[11.5px] font-extrabold" style={courseStyle}>
          {courseLabel}
        </p>
      )}
      {card.body ? (
        <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--ink)]">
          {card.body}
        </p>
      ) : null}
      {card.materials.length > 0 ? (
        <>
          <div className="my-2 border-t border-[var(--line)]" />
          <div className="relative z-10 flex flex-col gap-1">
            {card.materials.map((material) => (
              <MaterialChip
                key={material.id}
                orgSlug={orgSlug}
                courseId={card.courseId}
                unitId={material.unitId}
                materialId={material.id}
                title={material.title}
                kind={chipKind(material.assigned, material.due)}
                colorKey={card.colorKey}
                withIcon={withIcons}
              />
            ))}
          </div>
        </>
      ) : null}
      {card.chips.length > 0 ? (
        <div className="relative z-10 mt-2 flex flex-col gap-1">
          {card.chips.map((chip) => (
            <MaterialChip
              key={`${chip.kind}-${chip.materialId}`}
              orgSlug={orgSlug}
              courseId={chip.courseId}
              unitId={chip.unitId}
              materialId={chip.materialId}
              title={chip.title}
              kind={chip.kind}
              colorKey={chip.colorKey}
              unpublished={chip.unpublished}
              withIcon={withIcons}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
