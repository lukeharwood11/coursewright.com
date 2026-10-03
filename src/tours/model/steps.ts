import { coursePath, newCoursePath } from "@/courses/model/paths";
import { newLessonPlanPath } from "@/lesson-plans/model/paths";
import { TOUR_ANCHORS, type TourAnchor } from "./anchors";
import { TOUR_KEYS, type TourKey } from "./keys";

export type MissingPolicy =
  | { kind: "wait" }
  | { kind: "skip"; afterMs: number }
  | { kind: "skip-on-lesson-plan-page"; afterMs: number };

/**
 * next: point something out. The user is not supposed to click it to advance.
 * click: the spotlighted control is the move. Wait for that click.
 * submit: the spotlight is a form. Wait for submit, not for field clicks.
 * material: wait for the Material menu item (the click that starts the material).
 * next-anchor: wait until the taught action reveals the next step's target.
 */
export type StepAdvance = "next" | "click" | "submit" | "material" | "next-anchor";

export type TourStep = {
  anchor: TourAnchor;
  title: string;
  body: string;
  /** Navigate here before spotlighting. Null stays on the current page. */
  route: string | null;
  /** Settings lives in the sidebar, which is a drawer below the md breakpoint. */
  openMobileNav: boolean;
  missing: MissingPolicy;
  /** When "next", the tooltip keeps Next. Otherwise Next is hidden. */
  advance: StepAdvance;
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
        advance: "next",
      },
      {
        anchor: TOUR_ANCHORS.schoolDays,
        title: "School days",
        body: "Pick the days school meets.",
        route: `/my/${slug}/settings`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
        advance: "next",
      },
      {
        anchor: TOUR_ANCHORS.saveOrganization,
        title: "Save organization",
        body: "Save so the school week sticks.",
        route: `/my/${slug}/settings`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
        advance: "click",
      },
      {
        anchor: TOUR_ANCHORS.peopleTab,
        title: "People",
        body: "Open People to add someone who works with you.",
        route: `/my/${slug}/settings?tab=people`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
        advance: "next",
      },
      {
        anchor: TOUR_ANCHORS.inviteCollaborator,
        title: "First collaborator",
        body: "Add your first collaborator. Name, email, and role, then Add.",
        route: `/my/${slug}/settings?tab=people`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
        advance: "submit",
      },
    ];
  }

  if (key === TOUR_KEYS.firstCourse) {
    return [
      {
        anchor: TOUR_ANCHORS.createCourse,
        title: "Create your first course!",
        body: "Start here. You’ll add a unit and a material next, and we’ll stay with you.",
        route: `/my/${slug}`,
        openMobileNav: false,
        missing: ROUTE_WAIT,
        advance: "click",
      },
      {
        anchor: TOUR_ANCHORS.createCourseForm,
        title: "Make it yours",
        body: "Fill this in and create your course. You’ll land on the course page.",
        route: newCoursePath(slug),
        openMobileNav: false,
        missing: ROUTE_WAIT,
        advance: "next-anchor",
      },
      {
        anchor: TOUR_ANCHORS.addUnit,
        title: "Add your first unit",
        body: "A unit is home for the material. Create one and we’ll move on with you.",
        route: null,
        openMobileNav: false,
        missing: { kind: "wait" },
        advance: "next-anchor",
      },
      {
        anchor: TOUR_ANCHORS.addMaterial,
        title: "Add your first material",
        body: "Open Add and choose Material. Assignments and quizzes can wait.",
        route: null,
        openMobileNav: false,
        missing: { kind: "wait" },
        advance: "material",
      },
      {
        anchor: TOUR_ANCHORS.publishCourse,
        title: "Share it when you want",
        body: "Families can’t see this course until you publish it. There’s no rush.",
        route: null,
        openMobileNav: false,
        missing: PUBLISH_WAIT,
        advance: "next",
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
      advance: "next",
    },
    {
      anchor: TOUR_ANCHORS.saveLessonPlan,
      title: "Save the plan",
      body: "Plans start unpublished. Publish happens after you save.",
      route: courseId == null ? null : newLessonPlanPath(slug, courseId),
      openMobileNav: false,
      missing: ROUTE_WAIT,
      advance: "next",
    },
    {
      anchor: TOUR_ANCHORS.publishLessonPlan,
      title: "Publish the plan",
      body: "This page is the preview. Publish when the week is ready.",
      route: null,
      openMobileNav: false,
      missing: { kind: "skip-on-lesson-plan-page", afterMs: 1200 },
      advance: "next",
    },
    {
      anchor: TOUR_ANCHORS.previewAsFamily,
      title: "Preview as a family",
      body: "This is how a family sees the plan.",
      route: null,
      openMobileNav: false,
      missing: ROUTE_WAIT,
      advance: "next",
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

export type TourAction =
  | { kind: "anchor-click" }
  | { kind: "anchor-submit" }
  | { kind: "menu-item"; label: string }
  | { kind: "next-anchor-visible" };

/** True when this action is the one the step is waiting on. Next steps never auto-advance. */
export function shouldAdvanceFromAction(step: TourStep, action: TourAction): boolean {
  switch (step.advance) {
    case "next":
      return false;
    case "click":
      return action.kind === "anchor-click";
    case "submit":
      return action.kind === "anchor-submit";
    case "material":
      return action.kind === "menu-item" && action.label === "Material";
    case "next-anchor":
      return action.kind === "next-anchor-visible";
    default:
      return false;
  }
}

export type PrimaryControl = "next" | "done";

/**
 * Point-outs show a primary button. Earlier ones say Next.
 * The last step says Done when it is a point-out, or when the click it
 * would wait for is unavailable. Done finishes the tour. It is not Skip.
 * A click step that is not last hides the button, even if its target is
 * disabled. Save organization is that case.
 */
export function primaryControl(
  step: TourStep,
  input: { isLastStep: boolean; targetAvailable?: boolean },
): PrimaryControl | null {
  const waits = step.advance !== "next";
  if (!waits) return input.isLastStep ? "done" : "next";
  const unavailable = input.targetAvailable === false;
  if (input.isLastStep && unavailable) return "done";
  return null;
}

/** Visible label and accessible name. Never "Close". */
export function primaryButtonName(control: PrimaryControl): "Next" | "Done" {
  return control === "done" ? "Done" : "Next";
}
