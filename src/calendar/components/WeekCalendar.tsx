import { Link } from "react-router-dom";
import { courseColorCssVar } from "@/courses/model/courseColor";
import { lessonPlanPath } from "@/lesson-plans/model/paths";
import { weekdayDateHeading, weekdayShort } from "@/calendar/model/dates";
import { calendarPath } from "@/calendar/model/paths";
import {
  weekClassCards,
  weekDatesToShow,
  type CalendarLessonPlanDay,
  type CalendarMaterialChip,
  type CalendarWeekNote,
} from "@/calendar/model/events";
import { weekDates } from "@/lesson-plans/model/validate";
import {
  DEFAULT_SCHOOL_DAYS,
  isOrgSchoolDay,
  type SchoolDay,
} from "@/organizations/model/schoolDays";
import { CalendarClassBlock } from "./CalendarClassBlock";

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
  schoolDays = DEFAULT_SCHOOL_DAYS,
}: {
  orgSlug: string;
  weekStart: string;
  weekNotes: CalendarWeekNote[];
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
  hiddenCourseIds: Set<number>;
  /** `cards` (This week): skip empty days and wrap. `week` (Calendar): all seven columns. */
  layout?: "week" | "cards";
  schoolDays?: readonly SchoolDay[];
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
          {dates.map((date) => {
            const schoolDay = isOrgSchoolDay(date, schoolDays);
            const surfaceClass = schoolDay
              ? "cw-calendar-school-day"
              : "bg-[var(--surface)]";
            return (
            <section
              key={date}
              className={
                cards
                  ? `relative rounded-[10px] border border-[var(--line-soft)] ${surfaceClass} p-4`
                  : `relative min-h-[9rem] rounded-[10px] border border-[var(--line-soft)] ${surfaceClass} p-2`
              }
            >
              <Link
                to={calendarPath(orgSlug, { view: "day", date })}
                className="absolute inset-0 rounded-[10px]"
                aria-label={`Open ${weekdayDateHeading(date)}`}
              />
              <h3
                className={
                  cards
                    ? "relative z-10 pointer-events-none text-[14px] font-extrabold text-[var(--ink)]"
                    : "relative z-10 pointer-events-none text-[12px] font-bold text-[var(--ink-soft)]"
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
              <div className="relative z-10 mt-2 flex flex-col gap-2">
                {weekClassCards([date], visibleDays, visibleChips).map((card) => (
                  <CalendarClassBlock
                    key={`${card.date}-${card.courseId}-${card.planId ?? "chips"}`}
                    orgSlug={orgSlug}
                    card={card}
                  />
                ))}
              </div>
            </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
