import { Link } from "react-router-dom";
import { datesInRange, dayNumber } from "@/calendar/model/dates";
import { leftoverChips, type CalendarLessonPlanDay, type CalendarMaterialChip } from "@/calendar/model/events";
import { calendarPath } from "@/calendar/model/paths";
import { lessonPlanPath } from "@/lesson-plans/model/paths";
import { materialPath } from "@/materials/model/paths";
import { courseColorCssVar } from "@/courses/model/courseColor";

export function MonthCalendar({
  orgSlug,
  gridStart,
  gridEnd,
  monthStart,
  monthEnd,
  lessonDays,
  chips,
  hiddenCourseIds,
}: {
  orgSlug: string;
  gridStart: string;
  gridEnd: string;
  monthStart: string;
  monthEnd: string;
  lessonDays: CalendarLessonPlanDay[];
  chips: CalendarMaterialChip[];
  hiddenCourseIds: Set<number>;
}) {
  const dates = datesInRange(gridStart, gridEnd);
  const visibleDays = lessonDays.filter((day) => !hiddenCourseIds.has(day.courseId));
  const visibleChips = chips.filter((chip) => !hiddenCourseIds.has(chip.courseId));
  const headings = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {headings.map((label) => (
          <p key={label} className="px-1 text-[11.5px] font-bold text-[var(--ink-faint)]">
            {label}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date) => {
          const inMonth = date >= monthStart && date <= monthEnd;
          const dayPlans = visibleDays.filter((day) => day.date === date);
          const extra = leftoverChips(visibleChips, dayPlans, date);
          return (
            <div
              key={date}
              className={`relative min-h-[6.5rem] rounded-[8px] border p-1.5 ${
                inMonth
                  ? "border-[var(--line-soft)] bg-[var(--surface)]"
                  : "border-transparent bg-transparent text-[var(--ink-faint)]"
              }`}
            >
              <Link
                to={calendarPath(orgSlug, { view: "day", date })}
                className="absolute inset-0 rounded-[8px]"
                aria-label={`Open ${date}`}
              />
              <p className="relative z-10 pointer-events-none text-[12px] font-bold text-[var(--ink-soft)]">
                {dayNumber(date)}
              </p>
              <div className="relative z-10 mt-1 flex flex-col gap-0.5">
                {dayPlans.map((plan) => (
                  <Link
                    key={`${plan.planId}-${date}`}
                    to={lessonPlanPath(orgSlug, plan.courseId, plan.planId)}
                    className="truncate text-[10.5px] font-bold"
                    style={{ color: courseColorCssVar(plan.colorKey) }}
                  >
                    {plan.courseTitle}
                  </Link>
                ))}
                {extra.slice(0, 4).map((chip) => (
                  <Link
                    key={`${chip.kind}-${chip.materialId}`}
                    to={materialPath({
                      orgSlug,
                      courseId: chip.courseId,
                      unitId: chip.unitId,
                      materialId: chip.materialId,
                    })}
                    className="truncate rounded-[4px] px-1 py-px text-[10.5px] font-bold"
                    style={{
                      color: chip.kind === "due" ? "#fff" : courseColorCssVar(chip.colorKey),
                      background: chip.kind === "due" ? courseColorCssVar(chip.colorKey) : "transparent",
                      border: `1.5px solid ${courseColorCssVar(chip.colorKey)}`,
                    }}
                    title={`${chip.title} · ${chip.kind === "due" ? "Due" : "Assigned"}`}
                  >
                    {chip.title}
                  </Link>
                ))}
                {extra.length > 4 ? (
                  <Link
                    to={calendarPath(orgSlug, { view: "day", date })}
                    className="text-[10.5px] font-bold text-[var(--ink-faint)]"
                  >
                    +{extra.length - 4} more
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
