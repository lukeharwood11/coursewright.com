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
    <div className="flex h-full flex-col overflow-hidden px-5 py-4 md:px-8">
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h1
          className="min-w-0 text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Calendar
        </h1>
        <p className="min-w-0 text-[14px] text-[var(--ink-soft)]">{page.periodLabel}</p>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <CalendarToolbar
            view={page.view}
            onPrev={page.goPrev}
            onNext={page.goNext}
            onViewChange={page.setView}
          />
          {page.parentMode || !page.organization.features.events ? null : (
            <ButtonLink
              to={newEventPath(page.organization.slug, { date: page.focusDate })}
              className="shrink-0"
            >
              <PlusIcon className="h-5 w-5" aria-hidden />
              Add event
            </ButtonLink>
          )}
        </div>
      </header>

      <div className="mt-3 shrink-0">
        <CourseLegend
          courses={page.courses}
          hiddenCourseIds={page.hiddenCourseIds}
          onToggle={page.toggleCourse}
        />
      </div>

      {page.loading ? (
        <PageLoading embedded label="Loading calendar…" />
      ) : (
        <div className="mt-3 min-h-0 flex-1 overflow-auto">
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
