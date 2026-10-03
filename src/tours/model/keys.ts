export const TOUR_KEYS = {
  ownerSetup: "owner-setup-v1",
  firstCourse: "first-course-v1",
  lessonPlan: "lesson-plan-v1",
} as const;

export type TourKey = (typeof TOUR_KEYS)[keyof typeof TOUR_KEYS];

/** Later tours wait until the earlier key has a row, or that role does not qualify. */
export const TOUR_ORDER = [
  TOUR_KEYS.ownerSetup,
  TOUR_KEYS.firstCourse,
  TOUR_KEYS.lessonPlan,
] as const;

export type TourStatus = "finished" | "skipped";
