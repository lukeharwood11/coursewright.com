import { CalendarClassBlock } from "./CalendarClassBlock";
import {
  weekClassCards,
  type CalendarLessonPlanDay,
  type CalendarMaterialChip,
} from "@/calendar/model/events";

export function DayCalendar({
  orgSlug,
  date,
  lessonDays,
  chips,
  hiddenCourseIds,
}: {
  orgSlug: string;
  date: string;
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
  hiddenCourseIds: Set<number>;
}) {
  const visibleDays = lessonDays.filter((day) => !hiddenCourseIds.has(day.courseId));
  const visibleChips = chips.filter((chip) => !hiddenCourseIds.has(chip.courseId));
  const cards = weekClassCards([date], visibleDays, visibleChips);

  if (cards.length === 0) {
    return (
      <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Nothing on the calendar this day.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
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
