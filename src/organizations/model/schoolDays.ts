export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export type SchoolDay = (typeof WEEKDAYS)[number];

/** Monday–Friday. Matches JS `Date.getDay()`. */
export const DEFAULT_SCHOOL_DAYS: SchoolDay[] = [1, 2, 3, 4, 5];

export const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function isWeekdayNumber(value: number): value is SchoolDay {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function normalizeSchoolDays(days: readonly number[]): SchoolDay[] {
  const unique = new Set<SchoolDay>();
  for (const day of days) {
    if (isWeekdayNumber(day)) unique.add(day);
  }
  return [...unique].sort((left, right) => left - right);
}

export function parseSchoolDays(value: unknown): SchoolDay[] | null {
  if (!Array.isArray(value)) return null;
  const days = normalizeSchoolDays(
    value.filter((entry): entry is number => typeof entry === "number"),
  );
  return days.length > 0 ? days : null;
}

export function sameSchoolDays(
  left: readonly SchoolDay[],
  right: readonly SchoolDay[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((day, index) => day === right[index]);
}

/** Toggle a weekday. Refuses to clear the last remaining day. */
export function toggleSchoolDay(
  days: readonly SchoolDay[],
  day: SchoolDay,
): SchoolDay[] {
  const selected = new Set(normalizeSchoolDays(days));
  if (selected.has(day)) {
    if (selected.size <= 1) return normalizeSchoolDays(days);
    selected.delete(day);
  } else {
    selected.add(day);
  }
  return normalizeSchoolDays([...selected]);
}

export function weekdayOfIsoDate(isoDate: string): SchoolDay {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).getDay();
  return isWeekdayNumber(weekday) ? weekday : 0;
}

export function isOrgSchoolDay(
  isoDate: string,
  schoolDays: readonly SchoolDay[],
): boolean {
  return schoolDays.includes(weekdayOfIsoDate(isoDate));
}
