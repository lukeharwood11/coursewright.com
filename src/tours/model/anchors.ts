/** DOM hooks. Call sites use these constants, not string literals. */
export const TOUR_ANCHORS = {
  navSettings: "nav-settings",
  schoolDays: "school-days",
  saveOrganization: "save-organization",
  peopleTab: "people-tab",
  inviteCollaborator: "invite-collaborator",
  createCourse: "create-course",
  createCourseForm: "create-course-form",
  addUnit: "add-unit",
  addMaterial: "add-material",
  publishCourse: "publish-course",
  addLessonPlan: "add-lesson-plan",
  saveLessonPlan: "save-lesson-plan",
  publishLessonPlan: "publish-lesson-plan",
  previewAsFamily: "preview-as-family",
} as const;

export type TourAnchor = (typeof TOUR_ANCHORS)[keyof typeof TOUR_ANCHORS];

export function tourSelector(anchor: TourAnchor): string {
  return `[data-tour="${anchor}"]`;
}
