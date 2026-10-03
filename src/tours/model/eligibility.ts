import { isStaffRole, type OrgRole } from "@/organizations/model/role";
import { TOUR_KEYS, TOUR_ORDER, type TourKey } from "./keys";

export type TourEligibility = {
  role: OrgRole | null;
  /** Staff header is in family/preview chrome, not the staff shell. */
  parentPresentation: boolean;
  lessonPlansEnabled: boolean;
  /**
   * This organization already has at least one course.
   * Courses are org-scoped (no per-user creator), so this is the whole org.
   * lesson-plan-v1 needs a course to land on. It does not complete that tour.
   * first-course-v1 does not qualify when this is true, unless the tour
   * already started this session. Not qualifying writes no progress row.
   */
  hasCourse: boolean;
  /**
   * This session already started first-course-v1. Creating that course must
   * not drop the tour or pretend the tour was skipped.
   */
  firstCourseInProgress: boolean;
  seen: ReadonlySet<string>;
};

function staffChrome(input: TourEligibility): boolean {
  return Boolean(input.role && isStaffRole(input.role) && !input.parentPresentation);
}

function eligible(key: TourKey, input: TourEligibility): boolean {
  const staff = staffChrome(input);
  if (key === TOUR_KEYS.ownerSetup) return staff && input.role === "owner";
  if (key === TOUR_KEYS.firstCourse) {
    return staff && (!input.hasCourse || input.firstCourseInProgress);
  }
  return staff && input.lessonPlansEnabled && input.hasCourse;
}

/**
 * At most one tour. Skip a key the person cannot see. Block on an eligible
 * key that has no progress row. An ineligible key does not count as seen.
 */
export function selectActiveTour(input: TourEligibility): TourKey | null {
  for (const key of TOUR_ORDER) {
    if (!eligible(key, input)) continue;
    if (!input.seen.has(key)) return key;
  }
  return null;
}
