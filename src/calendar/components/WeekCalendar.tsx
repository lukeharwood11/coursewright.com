import { Link } from "react-router-dom";
import { courseColorCssVar } from "@/courses/model/courseColor";
import { lessonPlanPath } from "@/lesson-plans/model/paths";
import { weekdayDateHeading, weekdayShort } from "@/calendar/model/dates";
import {
  weekClassCards,
  weekDatesToShow,
  type CalendarLessonPlanDay,
  type CalendarMaterialChip,
  type CalendarWeekNote,
  type WeekClassCard,
} from "@/calendar/model/events";
import { weekDates } from "@/lesson-plans/model/validate";
import { chipKind, MaterialChip } from "./MaterialChip";

const wrappingCardGridClass =
  "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]";

export function WeekCalendar({
  orgSlug,
  weekStart,
  weekNotes,
  lessonDays,
  chips,
  hiddenCourseIds,
  layout = "week",
}: {
  orgSlug: string;
  weekStart: string;
  weekNotes: CalendarWeekNote[];
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
  hiddenCourseIds: Set<number>;
  /** `cards` (This week): skip empty days and wrap. `week` (Calendar): all seven columns. */
  layout?: "week" | "cards";
}) {
  const notes = weekNotes.filter((note) => !hiddenCourseIds.has(note.courseId));
  const visibleDays = lessonDays.filter((day) => !hiddenCourseIds.has(day.courseId));
  const visibleChips = chips.filter((chip) => !hiddenCourseIds.has(chip.courseId));
  const dates = weekDatesToShow(
    weekDates(weekStart),
    visibleDays,
    visibleChips,
    layout === "cards",
  );
  const cards = layout === "cards";

  return (
    <div>
      {notes.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2">
          {notes.map((note) => (
            <Link
              key={note.planId}
              to={lessonPlanPath(orgSlug, note.courseId, note.planId)}
              className="rounded-[10px] border px-3 py-2"
              style={{
                borderColor: courseColorCssVar(note.colorKey),
                background: "var(--surface)",
              }}
            >
              <p
                className="text-[12.5px] font-extrabold"
                style={{ color: courseColorCssVar(note.colorKey) }}
              >
                {note.courseTitle}
                {note.unpublished ? " · draft" : ""}
              </p>
              {note.weekNote ? (
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--ink)]">
                  {note.weekNote}
                </p>
              ) : (
                <p className="mt-1 text-[13px] font-semibold text-[var(--ink)]">{note.title}</p>
              )}
            </Link>
          ))}
        </div>
      ) : null}

      {dates.length > 0 ? (
        <div className={cards ? wrappingCardGridClass : "grid gap-2 md:grid-cols-7"}>
          {dates.map((date) => (
            <section
              key={date}
              className={
                cards
                  ? "rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
                  : "min-h-[9rem] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-2"
              }
            >
              <h3
                className={
                  cards
                    ? "text-[14px] font-extrabold text-[var(--ink)]"
                    : "text-[12px] font-bold text-[var(--ink-soft)]"
                }
              >
                {cards ? (
                  weekdayDateHeading(date)
                ) : (
                  <>
                    {weekdayShort(date)}
                    <span className="ml-1 text-[var(--ink-faint)]">{date.slice(8)}</span>
                  </>
                )}
              </h3>
              <div className="mt-2 flex flex-col gap-2">
                {weekClassCards([date], visibleDays, visibleChips).map((card) => (
                  <ClassBlock
                    key={`${card.date}-${card.courseId}-${card.planId ?? "chips"}`}
                    orgSlug={orgSlug}
                    card={card}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ClassBlock({ orgSlug, card }: { orgSlug: string; card: WeekClassCard }) {
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
          className="block text-[11.5px] font-extrabold"
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
          <div className="flex flex-col gap-1">
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
              />
            ))}
          </div>
        </>
      ) : null}
      {card.chips.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
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
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
