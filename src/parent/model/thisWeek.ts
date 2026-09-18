function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localIsoDate(now = new Date()): string {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return toIsoDate(date);
}

function formatShort(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Sunday–Saturday calendar week containing `now` (local timezone). */
export type CalendarWeek = {
  start: string;
  end: string;
  label: string;
};

export function calendarWeekContaining(now = new Date()): CalendarWeek {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    label: `Week of ${formatShort(start)} – ${formatShort(end)}`,
  };
}

export function formatMaterialDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dateInWeek(week: CalendarWeek, isoDate: string): boolean {
  return isoDate >= week.start && isoDate <= week.end;
}

/** Assignment date for This week: scheduled_date, else unit range overlap. */
export function isAssignedInCalendarWeek(
  week: CalendarWeek,
  scheduledDate: string | null,
  unitStart: string | null,
  unitEnd: string | null,
): boolean {
  if (scheduledDate) return dateInWeek(week, scheduledDate);
  if (unitStart && unitEnd) {
    return unitStart <= week.end && unitEnd >= week.start;
  }
  return false;
}

export function isDueInCalendarWeek(
  week: CalendarWeek,
  dueDate: string | null,
): boolean {
  return Boolean(dueDate && dateInWeek(week, dueDate));
}

/** Material belongs on This week when assigned this week and/or due this week. */
export function isInCalendarWeek(
  week: CalendarWeek,
  scheduledDate: string | null,
  unitStart: string | null,
  unitEnd: string | null,
  dueDate: string | null = null,
): boolean {
  return (
    isAssignedInCalendarWeek(week, scheduledDate, unitStart, unitEnd) ||
    isDueInCalendarWeek(week, dueDate)
  );
}
