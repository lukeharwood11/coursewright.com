import {
  calendarWeekContaining,
  calendarWeekForIsoDate,
  type CalendarWeek,
} from "./thisWeek";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parsed Sunday ISO for org home week navigation, or null for the real current week. */
export function parseOrgHomeWeekParam(raw: string | null): string | null {
  if (!raw || !ISO_DATE.test(raw)) return null;
  const week = calendarWeekForIsoDate(raw);
  if (week.start !== raw) return null;
  return raw;
}

export function parseOrgHomeWeekSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return parseOrgHomeWeekParam(params.get("week"));
}

export function resolveOrgHomeWeek(weekStart: string | null | undefined): CalendarWeek {
  const sunday = parseOrgHomeWeekParam(weekStart ?? null);
  if (sunday) return calendarWeekForIsoDate(sunday);
  return calendarWeekContaining();
}

export function orgHomePath(orgSlug: string, args?: { weekStart?: string | null }): string {
  const base = `/my/${orgSlug}`;
  const week = parseOrgHomeWeekParam(args?.weekStart ?? null);
  if (!week) return base;
  return `${base}?week=${week}`;
}
