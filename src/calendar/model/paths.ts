export function calendarPath(
  orgSlug: string,
  args?: { view?: "month" | "week"; date?: string },
): string {
  const params = new URLSearchParams();
  if (args?.view && args.view !== "month") params.set("view", args.view);
  if (args?.date) params.set("date", args.date);
  const query = params.toString();
  return query ? `/my/${orgSlug}/calendar?${query}` : `/my/${orgSlug}/calendar`;
}
