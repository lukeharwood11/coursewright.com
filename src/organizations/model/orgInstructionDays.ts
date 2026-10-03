import type { HomeDay } from "./homeDays";
import { addIsoDays } from "@/calendar/model/dates";
import {
  normalizeSchoolDays,
  weekdayOfIsoDate,
  type SchoolDay,
} from "./schoolDays";

/** Weekdays that count as school or home in org settings (union, sorted). */
export function orgInstructionWeekdays(
  schoolDays: readonly SchoolDay[],
  homeDays: readonly HomeDay[],
): SchoolDay[] {
  return normalizeSchoolDays([...schoolDays, ...homeDays]);
}

/** Latest ISO date in a Sun–Sat week that is a school or home day, or null if none. */
export function lastOrgInstructionDayInWeek(
  weekStart: string,
  schoolDays: readonly SchoolDay[],
  homeDays: readonly HomeDay[],
): string | null {
  const weekdays = orgInstructionWeekdays(schoolDays, homeDays);
  if (weekdays.length === 0) return null;
  for (let offset = 6; offset >= 0; offset -= 1) {
    const iso = addIsoDays(weekStart, offset);
    if (weekdays.includes(weekdayOfIsoDate(iso))) return iso;
  }
  return null;
}

export function isPastOrgInstructionWeek(
  weekStart: string,
  schoolDays: readonly SchoolDay[],
  homeDays: readonly HomeDay[],
  todayIso: string,
): boolean {
  const lastDay = lastOrgInstructionDayInWeek(weekStart, schoolDays, homeDays);
  if (!lastDay) return false;
  return todayIso > lastDay;
}
