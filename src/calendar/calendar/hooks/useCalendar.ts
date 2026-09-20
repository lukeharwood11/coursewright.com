import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { calendarQueryKeys, loadCalendarSource } from "@/calendar/databridge/calendar";
import { addIsoDays, monthContaining, shiftMonth, weekdayDateHeading } from "@/calendar/model/dates";
import { toggleHiddenCourse } from "@/calendar/model/events";
import { lessonPlansToDays, lessonPlansToWeekNotes, materialsToChips, plansForWeek } from "@/calendar/model/view";
import { calendarWeekContaining, localIsoDate } from "@/parent/model/thisWeek";
import { calendarPath, parseCalendarView, type CalendarView } from "@/calendar/model/paths";

export function useCalendar() {
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const [search, setSearch] = useSearchParams();
  const view = parseCalendarView(search.get("view"));
  const dateParam = search.get("date");
  const focusDate = dateParam || localIsoDate();
  const week = calendarWeekContaining(new Date(`${focusDate}T12:00:00`));
  const month = monthContaining(focusDate);
  const parentMode = parentPresentation || !staffCanEdit(role, parentPresentation);
  const rangeStart =
    view === "day" ? focusDate : view === "week" ? week.start : month.gridStart;
  const rangeEnd =
    view === "day" ? focusDate : view === "week" ? week.end : month.gridEnd;

  const query = useQuery({
    queryKey: calendarQueryKeys.range(
      organization.id,
      user.id,
      rangeStart,
      rangeEnd,
      parentMode,
    ),
    queryFn: () =>
      loadCalendarSource({
        organizationId: organization.id,
        userId: user.id,
        rangeStart,
        rangeEnd,
        parentMode,
      }),
  });

  const [hidden, setHidden] = useState<number[]>([]);
  const hiddenCourseIds = useMemo(() => new Set(hidden), [hidden]);
  const source = query.data;
  const weekPlans = plansForWeek(source?.lessonPlans ?? [], week.start);
  const periodLabel =
    view === "day"
      ? weekdayDateHeading(focusDate)
      : view === "week"
        ? week.label
        : month.label;

  function setView(next: CalendarView) {
    const params = new URLSearchParams(search);
    if (next === "month") params.delete("view");
    else params.set("view", next);
    setSearch(params, { replace: true });
  }

  function setDate(next: string) {
    const params = new URLSearchParams(search);
    params.set("date", next);
    setSearch(params, { replace: true });
  }

  return {
    organization,
    view,
    setView,
    focusDate,
    week,
    month,
    periodLabel,
    parentMode,
    courses: source?.courses ?? [],
    weekNotes: lessonPlansToWeekNotes(weekPlans),
    lessonDays: lessonPlansToDays(source?.lessonPlans ?? []),
    chips: materialsToChips(source?.materials ?? []),
    hiddenCourseIds,
    toggleCourse: (id: number) => setHidden((current) => toggleHiddenCourse(current, id)),
    loading: query.isLoading,
    error: query.error?.message ?? null,
    goPrev: () => {
      if (view === "day") setDate(addIsoDays(focusDate, -1));
      else if (view === "week") setDate(addIsoDays(week.start, -7));
      else setDate(shiftMonth(focusDate, -1));
    },
    goNext: () => {
      if (view === "day") setDate(addIsoDays(focusDate, 1));
      else if (view === "week") setDate(addIsoDays(week.start, 7));
      else setDate(shiftMonth(focusDate, 1));
    },
    calendarHref: calendarPath(organization.slug, { view, date: focusDate }),
  };
}
