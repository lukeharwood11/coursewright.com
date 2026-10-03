import assert from "node:assert/strict";
import { test } from "node:test";
import { TOUR_ANCHORS } from "./anchors.ts";
import { selectActiveTour } from "./eligibility.ts";
import { TOUR_KEYS } from "./keys.ts";
import {
  courseIdFromPath,
  isLessonPlanDetailPath,
  locationMatches,
  orgSlugFromPath,
} from "./location.ts";
import { decideStep, stepsForTour } from "./steps.ts";
import { tourSessionKey } from "./sessionStep.ts";

const unseen = new Set<string>();

test("owner sees owner-setup before the other tours", () => {
  assert.equal(
    selectActiveTour({
      role: "owner",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      seen: unseen,
    }),
    TOUR_KEYS.ownerSetup,
  );
});

test("an instructor skips owner-setup and starts on the first course", () => {
  assert.equal(
    selectActiveTour({
      role: "instructor",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      seen: unseen,
    }),
    TOUR_KEYS.firstCourse,
  );
});

test("later tours wait until the earlier key has a row", () => {
  assert.equal(
    selectActiveTour({
      role: "owner",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      seen: new Set([TOUR_KEYS.ownerSetup]),
    }),
    TOUR_KEYS.firstCourse,
  );
  assert.equal(
    selectActiveTour({
      role: "admin",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      seen: new Set([TOUR_KEYS.firstCourse]),
    }),
    TOUR_KEYS.lessonPlan,
  );
});

test("lesson plans wait for a course and for the feature flag", () => {
  const base = {
    role: "owner" as const,
    parentPresentation: false,
    seen: new Set<string>([TOUR_KEYS.ownerSetup, TOUR_KEYS.firstCourse]),
  };
  assert.equal(
    selectActiveTour({ ...base, lessonPlansEnabled: true, hasCourse: false }),
    null,
  );
  assert.equal(
    selectActiveTour({ ...base, lessonPlansEnabled: false, hasCourse: true }),
    null,
  );
  assert.equal(
    selectActiveTour({ ...base, lessonPlansEnabled: true, hasCourse: true }),
    TOUR_KEYS.lessonPlan,
  );
});

test("parents, students, observers, and preview chrome see no tour", () => {
  for (const role of ["parent", "student", "observer"] as const) {
    assert.equal(
      selectActiveTour({
        role,
        parentPresentation: false,
        lessonPlansEnabled: true,
        hasCourse: true,
        seen: unseen,
      }),
      null,
    );
  }
  assert.equal(
    selectActiveTour({
      role: "owner",
      parentPresentation: true,
      lessonPlansEnabled: true,
      hasCourse: true,
      seen: unseen,
    }),
    null,
  );
});

test("a seen key does not replay", () => {
  assert.equal(
    selectActiveTour({
      role: "instructor",
      parentPresentation: false,
      lessonPlansEnabled: false,
      hasCourse: false,
      seen: new Set([TOUR_KEYS.firstCourse]),
    }),
    null,
  );
});

test("owner-setup routes stay on settings and people, not the events calendar", () => {
  const steps = stepsForTour(TOUR_KEYS.ownerSetup, { orgSlug: "coop", courseId: null });
  assert.deepEqual(
    steps.map((step) => step.anchor),
    [
      TOUR_ANCHORS.navSettings,
      TOUR_ANCHORS.schoolDays,
      TOUR_ANCHORS.saveOrganization,
      TOUR_ANCHORS.peopleTab,
      TOUR_ANCHORS.inviteCollaborator,
    ],
  );
  assert.equal(steps[1]?.route, "/my/coop/settings");
  assert.equal(steps[3]?.route, "/my/coop/settings?tab=people");
  assert.equal(steps[0]?.openMobileNav, true);
});

test("first-course publish step is skippable and does not invent a route", () => {
  const steps = stepsForTour(TOUR_KEYS.firstCourse, { orgSlug: "coop", courseId: 4 });
  const publish = steps.find((step) => step.anchor === TOUR_ANCHORS.publishCourse);
  assert.equal(publish?.route, null);
  assert.equal(publish?.missing.kind, "skip");
  assert.match(publish?.body ?? "", /Families cannot see the course until this is published/);
});

test("lesson-plan steps do not include day presets or a publish on /new", () => {
  const steps = stepsForTour(TOUR_KEYS.lessonPlan, { orgSlug: "coop", courseId: 9 });
  assert.equal(steps[1]?.route, "/my/coop/courses/9/lesson-plans/new");
  assert.equal(steps[1]?.anchor, TOUR_ANCHORS.saveLessonPlan);
  assert.equal(steps[2]?.route, null);
  assert.equal(steps[2]?.missing.kind, "skip-on-lesson-plan-page");
  assert.match(steps[3]?.body ?? "", /how a family sees the plan/);
  assert.equal(
    steps.some((step) => step.body.toLowerCase().includes("days to show")),
    false,
  );
});

test("decideStep skips a missing publish target and waits for a unit", () => {
  const course = stepsForTour(TOUR_KEYS.firstCourse, { orgSlug: "coop", courseId: null });
  const addUnit = course[2];
  const publish = course[4];
  assert.ok(addUnit && publish);
  assert.equal(
    decideStep(addUnit, { anchorVisible: false, pathname: "/my/coop/courses/3", elapsedMs: 20_000 }),
    "wait",
  );
  assert.equal(
    decideStep(publish, { anchorVisible: false, pathname: "/my/coop/courses/3", elapsedMs: 200 }),
    "wait",
  );
  assert.equal(
    decideStep(publish, { anchorVisible: false, pathname: "/my/coop/courses/3", elapsedMs: 1200 }),
    "skip",
  );
  assert.equal(
    decideStep(publish, { anchorVisible: true, pathname: "/my/coop/courses/3", elapsedMs: 1200 }),
    "show",
  );
});

test("lesson-plan publish skips only after the detail page has settled", () => {
  const step = stepsForTour(TOUR_KEYS.lessonPlan, { orgSlug: "coop", courseId: 9 })[2];
  assert.ok(step);
  assert.equal(
    decideStep(step, {
      anchorVisible: false,
      pathname: "/my/coop/courses/9/lesson-plans/new",
      elapsedMs: 5000,
    }),
    "wait",
  );
  assert.equal(
    decideStep(step, {
      anchorVisible: false,
      pathname: "/my/coop/courses/9/lesson-plans/12",
      elapsedMs: 1200,
    }),
    "skip",
  );
});

test("path helpers ignore account settings and match search exactly", () => {
  assert.equal(orgSlugFromPath("/my/settings"), null);
  assert.equal(orgSlugFromPath("/my/coop/courses"), "coop");
  assert.equal(courseIdFromPath("/my/coop/courses/12/lesson-plans/new", "coop"), 12);
  assert.equal(isLessonPlanDetailPath("/my/coop/courses/12/lesson-plans/4"), true);
  assert.equal(isLessonPlanDetailPath("/my/coop/courses/12/lesson-plans/new"), false);
  assert.equal(
    locationMatches(
      { pathname: "/my/coop/settings", search: "?tab=people" },
      "/my/coop/settings?tab=people",
    ),
    true,
  );
  assert.equal(
    locationMatches(
      { pathname: "/my/coop/settings", search: "?tab=people&peopleView=access" },
      "/my/coop/settings?tab=people",
    ),
    false,
  );
  assert.equal(tourSessionKey("user-1", TOUR_KEYS.ownerSetup), "cw-product-tour-step:user-1:owner-setup-v1");
});
