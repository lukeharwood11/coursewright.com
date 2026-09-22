import { CalendarClassBlock } from "./CalendarClassBlock";
import {
  visibleEvents,
  weekClassCards,
  type CalendarEventChip,
  type CalendarLessonPlanDay,
  type CalendarMaterialChip,
} from "@/calendar/model/events";
import { EventChip } from "./EventChip";
import {
  DEFAULT_SCHOOL_DAYS,
  isOrgSchoolDay,
  type SchoolDay,
} from "@/organizations/model/schoolDays";

export function DayCalendar({
  orgSlug,
  date,
  lessonDays,
  chips,
  events = [],
  hiddenCourseIds,
  schoolDays = DEFAULT_SCHOOL_DAYS,
}: {
  orgSlug: string;
  date: string;
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
  events?: CalendarEventChip[];
  hiddenCourseIds: Set<number>;
  schoolDays?: readonly SchoolDay[];
}) {
  const visibleDays = lessonDays.filter((day) => !hiddenCourseIds.has(day.courseId));
  const visibleChips = chips.filter((chip) => !hiddenCourseIds.has(chip.courseId));
  const dayEvents = visibleEvents(events, hiddenCourseIds).filter((event) => event.date === date);
  const cards = weekClassCards([date], visibleDays, visibleChips);

  if (cards.length === 0 && dayEvents.length === 0) {
    return (
      <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Nothing on the calendar this day.
      </p>
    );
  }

  const surfaceClass = isOrgSchoolDay(date, schoolDays)
    ? "cw-calendar-school-day"
    : "bg-[var(--surface)]";

  return (
    <div
      className={`flex flex-col gap-4 rounded-[10px] border border-[var(--line-soft)] ${surfaceClass} p-4`}
    >
      {dayEvents.length > 0 ? (
        <div className="flex flex-col gap-2">
          {dayEvents.map((event) => (
            <EventChip
              key={event.eventId}
              orgSlug={orgSlug}
              eventId={event.eventId}
              title={event.title}
              location={event.location}
              startTime={event.startTime}
              endTime={event.endTime}
              colorKey={event.colorKey}
              showDetails
            />
          ))}
        </div>
      ) : null}
      {cards.map((card) => (
        <CalendarClassBlock
          key={`${card.date}-${card.courseId}-${card.planId ?? "chips"}`}
          orgSlug={orgSlug}
          card={card}
        />
      ))}
    </div>
  );
}
