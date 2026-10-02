import {
  DEFAULT_SCHOOL_DAYS,
  type SchoolDay,
} from "@/organizations/model/schoolDays";
import type { HomeDay } from "@/organizations/model/homeDays";

export type LessonPlanDaysPreset = "school" | "home" | "weekdays";

export const LESSON_PLAN_DAYS_PRESET_LABELS: Record<LessonPlanDaysPreset, string> = {
  school: "School days",
  home: "Home days",
  weekdays: "Weekdays",
};

const STORAGE_PREFIX = "cw-lesson-plan-days-preset:";

export function lessonPlanDaysPresetStorageKey(courseId: number): string {
  return `${STORAGE_PREFIX}${courseId}`;
}

export function parseLessonPlanDaysPreset(value: string | null): LessonPlanDaysPreset {
  if (value === "home" || value === "weekdays") return value;
  return "school";
}

export function readStoredLessonPlanDaysPreset(courseId: number): LessonPlanDaysPreset {
  if (!Number.isFinite(courseId) || typeof window === "undefined") return "school";
  try {
    return parseLessonPlanDaysPreset(
      window.localStorage.getItem(lessonPlanDaysPresetStorageKey(courseId)),
    );
  } catch {
    return "school";
  }
}

export function writeStoredLessonPlanDaysPreset(
  courseId: number,
  preset: LessonPlanDaysPreset,
): void {
  if (!Number.isFinite(courseId)) return;
  try {
    window.localStorage.setItem(lessonPlanDaysPresetStorageKey(courseId), preset);
  } catch {
    /* ignore quota / private mode */
  }
}

export function weekdaysForLessonPlanPreset(
  preset: LessonPlanDaysPreset,
  schoolDays: readonly SchoolDay[],
  homeDays: readonly HomeDay[],
): readonly SchoolDay[] {
  switch (preset) {
    case "home":
      return homeDays;
    case "weekdays":
      return DEFAULT_SCHOOL_DAYS;
    case "school":
    default:
      return schoolDays;
  }
}
