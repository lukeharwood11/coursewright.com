import { calendarWeekContaining, type CalendarWeek } from "@/parent/model/thisWeek";
import { uniqueMaterialIds } from "./materials";

export type LessonPlanDayDraft = {
  date: string;
  body: string;
  materialIds: number[];
};

export type LessonPlanDraft = {
  title: string;
  weekNote: string;
  weekStart: string;
  days: LessonPlanDayDraft[];
};

export function defaultLessonPlanTitle(courseTitle: string): string {
  const name = courseTitle.trim();
  return name ? `This week in ${name}` : "This week";
}

export function emptyDaysForWeek(weekStart: string): LessonPlanDayDraft[] {
  return weekDates(weekStart).map((date) => ({
    date,
    body: "",
    materialIds: [],
  }));
}

export function weekDates(weekStart: string): string[] {
  const [year, month, day] = weekStart.split("-").map(Number);
  if (!year || !month || !day) return [];
  const start = new Date(year, month - 1, day);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
}

export function sundayOnOrBefore(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() - date.getDay());
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSunday(isoDate: string): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return false;
  return new Date(year, month - 1, day).getDay() === 0;
}

export function weekFromParam(value: string | null): CalendarWeek {
  if (value) return calendarWeekContaining(parseIsoDate(sundayOnOrBefore(value)));
  return calendarWeekContaining();
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function remapDaysToWeek(
  days: LessonPlanDayDraft[],
  weekStart: string,
): LessonPlanDayDraft[] {
  const byWeekday = new Map<number, LessonPlanDayDraft>();
  for (const day of days) {
    const date = parseIsoDate(day.date);
    byWeekday.set(date.getDay(), day);
  }
  return weekDates(weekStart).map((date, index) => {
    const previous = byWeekday.get(index);
    return {
      date,
      body: previous?.body ?? "",
      materialIds: previous?.materialIds ?? [],
    };
  });
}

export function daysToPersist(days: LessonPlanDayDraft[]): LessonPlanDayDraft[] {
  return days
    .map((day) => ({
      ...day,
      body: day.body.trim(),
      materialIds: uniqueMaterialIds(day.materialIds),
    }))
    .filter((day) => day.body.length > 0 || day.materialIds.length > 0);
}

/** Teacher/family view: skip days with no note and no materials; keep date order. */
export function lessonPlanDaysToShow<T extends { date: string; body: string; materials: readonly unknown[] }>(
  days: T[],
): T[] {
  return days
    .filter((day) => day.body.trim().length > 0 || day.materials.length > 0)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function validateLessonPlanDraft(draft: LessonPlanDraft): string | null {
  if (!draft.title.trim()) return "Add a title so families know what this is.";
  if (!draft.weekStart) return "Choose the week this plan is for.";
  if (!isSunday(draft.weekStart)) {
    return "Lesson plans start on Sunday.";
  }
  return null;
}

export function weekdayLabel(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function weekdayDateLabel(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
