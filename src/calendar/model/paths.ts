export type CalendarView = "month" | "week" | "day";

export function parseCalendarView(value: string | null): CalendarView {
  if (value === "week" || value === "day") return value;
  return "month";
}

export function calendarPath(
  orgSlug: string,
  args?: { view?: CalendarView; date?: string },
): string {
  const params = new URLSearchParams();
  if (args?.view && args.view !== "month") params.set("view", args.view);
  if (args?.date) params.set("date", args.date);
  const query = params.toString();
  return query ? `/my/${orgSlug}/calendar?${query}` : `/my/${orgSlug}/calendar`;
}
