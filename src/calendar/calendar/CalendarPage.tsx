import { useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { newEventPath } from "@/events/model/paths";
import { CourseLegend } from "@/calendar/components/CourseLegend";
import { DayCalendar } from "@/calendar/components/DayCalendar";
import { MonthCalendar } from "@/calendar/components/MonthCalendar";
import { WeekCalendar } from "@/calendar/components/WeekCalendar";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { useCalendar } from "./hooks/useCalendar";
import { useToastOnError } from "@/ui/useToastOnError";

export function CalendarPage() {
  const page = useCalendar();
  useToastOnError(page.error);

  useEffect(() => {
    document.title = "Calendar · Course Wright";
  }, []);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Calendar
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            {page.periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {page.parentMode ? null : (
            <ButtonLink
              to={newEventPath(page.organization.slug, { date: page.focusDate })}
            >
              <PlusIcon className="h-5 w-5" aria-hidden />
              Add event
            </ButtonLink>
          )}
          <CalendarToolbar
            view={page.view}
            onPrev={page.goPrev}
            onNext={page.goNext}
            onViewChange={page.setView}
          />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-[var(--ink-faint)]">
        Filled chips are due. Outlined chips are assigned. Events show the title here, and the
        time and location when you open the day. Tap a class in the legend to hide it. Tap a day
        to open that day.
      </p>

      <div className="mt-4">
        <CourseLegend
          courses={page.courses}
          hiddenCourseIds={page.hiddenCourseIds}
          onToggle={page.toggleCourse}
        />
      </div>

      {page.loading ? (
        <PageLoading embedded label="Loading calendar…" />
      ) : (
        <div className="mt-5">
          {page.view === "week" ? (
            <WeekCalendar
              orgSlug={page.organization.slug}
              weekStart={page.week.start}
              weekNotes={page.weekNotes}
              lessonDays={page.lessonDays}
              chips={page.chips}
              events={page.events}
              hiddenCourseIds={page.hiddenCourseIds}
              schoolDays={page.organization.schoolDays}
            />
          ) : page.view === "day" ? (
            <DayCalendar
              orgSlug={page.organization.slug}
              date={page.focusDate}
              lessonDays={page.lessonDays}
              chips={page.chips}
              events={page.events}
              hiddenCourseIds={page.hiddenCourseIds}
              schoolDays={page.organization.schoolDays}
            />
          ) : (
            <MonthCalendar
              orgSlug={page.organization.slug}
              gridStart={page.month.gridStart}
              gridEnd={page.month.gridEnd}
              monthStart={page.month.start}
              monthEnd={page.month.end}
              lessonDays={page.lessonDays}
              chips={page.chips}
              events={page.events}
              hiddenCourseIds={page.hiddenCourseIds}
              schoolDays={page.organization.schoolDays}
            />
          )}
        </div>
      )}
    </div>
  );
}
