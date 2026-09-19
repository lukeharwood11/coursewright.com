import { useEffect } from "react";
import { Button } from "@/ui/Button";
import { CourseLegend } from "@/calendar/components/CourseLegend";
import { MonthCalendar } from "@/calendar/components/MonthCalendar";
import { WeekCalendar } from "@/calendar/components/WeekCalendar";
import { useCalendar } from "./hooks/useCalendar";

export function CalendarPage() {
  const page = useCalendar();

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
            {page.view === "week" ? page.week.label : page.month.label}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={page.goPrev}>
            Previous
          </Button>
          <Button variant="secondary" type="button" onClick={page.goNext}>
            Next
          </Button>
          <Button
            variant={page.view === "month" ? "primary" : "secondary"}
            type="button"
            onClick={() => page.setView("month")}
          >
            Month
          </Button>
          <Button
            variant={page.view === "week" ? "primary" : "secondary"}
            type="button"
            onClick={() => page.setView("week")}
          >
            Week
          </Button>
        </div>
      </div>

      <p className="mt-3 text-[13px] text-[var(--ink-faint)]">
        Filled chips are due. Outlined chips are assigned. Tap a class in the legend to hide it.
      </p>

      <div className="mt-4">
        <CourseLegend
          courses={page.courses}
          hiddenCourseIds={page.hiddenCourseIds}
          onToggle={page.toggleCourse}
        />
      </div>

      {page.loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading calendar…</p>
      ) : page.error ? (
        <p className="mt-6 text-[13px] text-[var(--amber-deep)]" role="alert">
          {page.error}
        </p>
      ) : (
        <div className="mt-5">
          {page.view === "week" ? (
            <WeekCalendar
              orgSlug={page.organization.slug}
              weekStart={page.week.start}
              weekNotes={page.weekNotes}
              lessonDays={page.lessonDays}
              chips={page.chips}
              hiddenCourseIds={page.hiddenCourseIds}
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
              hiddenCourseIds={page.hiddenCourseIds}
            />
          )}
        </div>
      )}
    </div>
  );
}
