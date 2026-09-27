import { isOrgHomeDay, type HomeDay } from "@/organizations/model/homeDays";
import {
  DEFAULT_SCHOOL_DAYS,
  isOrgSchoolDay,
  type SchoolDay,
} from "@/organizations/model/schoolDays";

export type MaterialFocusDayKind = "home" | "school";

export function materialFocusDayKind(
  isoDate: string,
  schoolDays: readonly SchoolDay[] = DEFAULT_SCHOOL_DAYS,
  homeDays: readonly HomeDay[] = [],
): MaterialFocusDayKind | null {
  if (!isoDate) return null;
  if (isOrgHomeDay(isoDate, homeDays)) return "home";
  if (isOrgSchoolDay(isoDate, schoolDays)) return "school";
  return null;
}

/**
 * Edit form field title for `scheduled_date` on a material (not an assignment).
 * Matches a school or home day as Focus Day; otherwise Date available.
 */
export function materialAvailableDateFieldLabel(
  isoDate: string,
  schoolDays: readonly SchoolDay[] = DEFAULT_SCHOOL_DAYS,
  homeDays: readonly HomeDay[] = [],
): string {
  const kind = materialFocusDayKind(isoDate, schoolDays, homeDays);
  if (kind === "home") return "Focus Day (Home)";
  if (kind === "school") return "Focus Day (School)";
  return "Date available";
}

/** Edit form field title for `scheduled_date` on an assignment. */
export function materialFocusDayFieldLabel(
  isoDate: string,
  schoolDays: readonly SchoolDay[] = DEFAULT_SCHOOL_DAYS,
  homeDays: readonly HomeDay[] = [],
): string {
  const kind = materialFocusDayKind(isoDate, schoolDays, homeDays);
  if (kind === "home") return "Focus Day (Home)";
  if (kind === "school") return "Focus Day (School)";
  return "Focus Day";
}

/** Compact label for lists and material header (date shown separately). */
export function materialForDateLabel(
  isoDate: string,
  schoolDays: readonly SchoolDay[] = DEFAULT_SCHOOL_DAYS,
  homeDays: readonly HomeDay[] = [],
): string {
  const kind = materialFocusDayKind(isoDate, schoolDays, homeDays);
  if (kind === "home") return "Focus Day (Home)";
  if (kind === "school") return "Focus Day (School)";
  return "Focus Day";
}
