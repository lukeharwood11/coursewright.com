import { coursePath, newCoursePath } from "@/courses/model/paths";
import { newLessonPlanPath } from "@/lesson-plans/model/paths";
import { TOUR_ANCHORS, type TourAnchor } from "./anchors";
import { TOUR_KEYS, type TourKey } from "./keys";

export type MissingPolicy =
  | { kind: "wait" }
  | { kind: "skip"; afterMs: number }
  | { kind: "skip-on-lesson-plan-page"; afterMs: number };

export type TourStep = {
  anchor: TourAnchor;
  title: string;
  body: string;
  /** Navigate here before spotlighting. Null stays on the current page. */
  route: string | null;
  /** Settings lives in the sidebar, which is a drawer below the md breakpoint. */
  openMobileNav: boolean;
  missing: MissingPolicy;
};

const ROUTE_WAIT: MissingPolicy = { kind: "skip", afterMs: 8000 };
const PUBLISH_WAIT: MissingPolicy = { kind: "skip", afterMs: 1200 };

export function stepsForTour(
  key: TourKey,
  input: { orgSlug: string; courseId: number | null },
): TourStep[] {
  const slug = input.orgSlug;
  if (key === TOUR_KEYS.ownerSetup) {
    return [
      {
        anchor: TOUR_ANCHORS.navSettings,
        title: "Settings",
        body: "School days and collaborators live in Settings.",
        route: `/my/${slug}`,
        openMobileNav: true,
        missing: ROUTE_WAIT,
      },
      {
        anchor: TOUR_ANCHORS.schoolDays,
        title: "School days",
        body: "Pick the days school meets.",
        route: `/my/${slug}/settings`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
      },
      {
        anchor: TOUR_ANCHORS.saveOrganization,
        title: "Save organization",
        body: "Save so the school week sticks.",
        route: `/my/${slug}/settings`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
      },
      {
        anchor: TOUR_ANCHORS.peopleTab,
        title: "People",
        body: "Open People to add someone who works with you.",
        route: `/my/${slug}/settings?tab=people`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
      },
      {
        anchor: TOUR_ANCHORS.inviteCollaborator,
        title: "First collaborator",
        body: "Add your first collaborator. Name, email, and role, then Add.",
        route: `/my/${slug}/settings?tab=people`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
      },
    ];
  }

  if (key === TOUR_KEYS.firstCourse) {
    return [
      {
        anchor: TOUR_ANCHORS.createCourse,
        title: "Create a course",
        body: "Start here. You’ll add a unit and a material next.",
        route: `/my/${slug}`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
      },
      {
        anchor: TOUR_ANCHORS.createCourseForm,
        title: "New course",
        body: "Fill this in and create the course. You’ll land on the course page.",
        route: newCoursePath(slug),
        openMobileNav: false,
        missing: ROUTE_WAIT,
      },
      {
        anchor: TOUR_ANCHORS.addUnit,
        title: "Add a unit",
        body: "Create a new unit to start adding material.",
        route: null,
        openMobileNav: false,
        missing: { kind: "wait" },
      },
      {
        anchor: TOUR_ANCHORS.addMaterial,
        title: "Add material",
        body: "Open Add and choose Material. Assignments and quizzes can wait.",
        route: null,
        openMobileNav: false,
        missing: { kind: "wait" },
      },
      {
        anchor: TOUR_ANCHORS.publishCourse,
        title: "Publish the course",
        body: "Families cannot see the course until this is published.",
        route: null,
        openMobileNav: false,
        missing: PUBLISH_WAIT,
      },
    ];
  }

  const courseId = input.courseId;
  return [
    {
      anchor: TOUR_ANCHORS.addLessonPlan,
      title: "Add a lesson plan",
      body: "A plan hangs on a course. You don’t need a unit, and materials are optional.",
      route: courseId == null ? null : coursePath(slug, courseId),
      openMobileNav: false,
      missing: ROUTE_WAIT,
    },
    {
      anchor: TOUR_ANCHORS.saveLessonPlan,
      title: "Save the plan",
      body: "Plans start unpublished. Publish happens after you save.",
      route: courseId == null ? null : newLessonPlanPath(slug, courseId),
      openMobileNav: false,
      missing: ROUTE_WAIT,
    },
    {
      anchor: TOUR_ANCHORS.publishLessonPlan,
      title: "Publish the plan",
      body: "This page is the preview. Publish when the week is ready.",
      route: null,
      openMobileNav: false,
      missing: { kind: "skip-on-lesson-plan-page", afterMs: 1200 },
    },
    {
      anchor: TOUR_ANCHORS.previewAsFamily,
      title: "Preview as a family",
      body: "This is how a family sees the plan.",
      route: null,
      openMobileNav: false,
      missing: ROUTE_WAIT,
    },
  ];
}

export type StepDecision = "show" | "skip" | "wait";

export function decideStep(
  step: TourStep,
  input: { anchorVisible: boolean; pathname: string; elapsedMs: number },
): StepDecision {
  if (input.anchorVisible) return "show";
  if (step.missing.kind === "wait") return "wait";
  if (step.missing.kind === "skip") {
    return input.elapsedMs >= step.missing.afterMs ? "skip" : "wait";
  }
  const onDetail = /^\/my\/[^/]+\/courses\/\d+\/lesson-plans\/\d+$/.test(input.pathname);
  if (onDetail && input.elapsedMs >= step.missing.afterMs) return "skip";
  return "wait";
}
