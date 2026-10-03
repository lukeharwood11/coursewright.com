import { isStaffRole, type OrgRole } from "@/organizations/model/role";
import { TOUR_KEYS, TOUR_ORDER, type TourKey } from "./keys";

export type TourEligibility = {
  role: OrgRole | null;
  /** Staff header is in family/preview chrome, not the staff shell. */
  parentPresentation: boolean;
  lessonPlansEnabled: boolean;
  /** lesson-plan-v1 needs a course page to land on. It does not complete the tour. */
  hasCourse: boolean;
  seen: ReadonlySet<string>;
};

function staffChrome(input: TourEligibility): boolean {
  return Boolean(input.role && isStaffRole(input.role) && !input.parentPresentation);
}

function eligible(key: TourKey, input: TourEligibility): boolean {
  const staff = staffChrome(input);
  if (key === TOUR_KEYS.ownerSetup) return staff && input.role === "owner";
  if (key === TOUR_KEYS.firstCourse) return staff;
  return staff && input.lessonPlansEnabled && input.hasCourse;
}

/**
 * At most one tour. Skip a key the role cannot see. Block on an eligible key
 * that has no progress row.
 */
export function selectActiveTour(input: TourEligibility): TourKey | null {
  for (const key of TOUR_ORDER) {
    if (!eligible(key, input)) continue;
    if (!input.seen.has(key)) return key;
  }
  return null;
}
