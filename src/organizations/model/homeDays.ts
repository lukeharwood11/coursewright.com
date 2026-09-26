import {
  normalizeSchoolDays,
  sameSchoolDays,
  type SchoolDay,
  weekdayOfIsoDate,
  WEEKDAY_NAMES,
} from "./schoolDays";

export type HomeDay = SchoolDay;

export const DEFAULT_HOME_DAYS: HomeDay[] = [];

export function normalizeHomeDays(days: readonly number[]): HomeDay[] {
  return normalizeSchoolDays(days);
}

export function parseHomeDays(value: unknown): HomeDay[] {
  if (!Array.isArray(value)) return DEFAULT_HOME_DAYS;
  return normalizeHomeDays(
    value.filter((entry): entry is number => typeof entry === "number"),
  );
}

export function sameHomeDays(
  left: readonly HomeDay[],
  right: readonly HomeDay[],
): boolean {
  return sameSchoolDays(left, right);
}

export function toggleHomeDay(
  days: readonly HomeDay[],
  day: HomeDay,
): HomeDay[] {
  const selected = new Set(normalizeHomeDays(days));
  if (selected.has(day)) {
    selected.delete(day);
  } else {
    selected.add(day);
  }
  return normalizeHomeDays([...selected]);
}

export function isOrgHomeDay(
  isoDate: string,
  homeDays: readonly HomeDay[],
): boolean {
  if (homeDays.length === 0) return false;
  return homeDays.includes(weekdayOfIsoDate(isoDate));
}

export function homeDaysLabel(days: readonly HomeDay[]): string {
  const normalized = normalizeHomeDays(days);
  if (normalized.length === 0) return "None";
  return normalized.map((day) => WEEKDAY_NAMES[day]).join(", ");
}
