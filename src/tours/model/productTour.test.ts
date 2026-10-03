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
import { decideStep, primaryButtonName, shouldAdvanceFromAction, stepsForTour } from "./steps.ts";
import { tourLaterKey, tourSessionKey } from "./sessionStep.ts";

const unseen = new Set<string>();

test("owner sees owner-setup before the other tours", () => {
  assert.equal(
    selectActiveTour({
      role: "owner",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      firstCourseInProgress: false,
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
      hasCourse: false,
      firstCourseInProgress: false,
      seen: unseen,
    }),
    TOUR_KEYS.firstCourse,
  );
});

test("an existing course skips first-course and does not block lesson plans", () => {
  assert.equal(
    selectActiveTour({
      role: "instructor",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      firstCourseInProgress: false,
      seen: unseen,
    }),
    TOUR_KEYS.lessonPlan,
  );
  assert.equal(
    selectActiveTour({
      role: "owner",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      firstCourseInProgress: false,
      seen: new Set([TOUR_KEYS.ownerSetup]),
    }),
    TOUR_KEYS.lessonPlan,
  );
  assert.equal(
    selectActiveTour({
      role: "admin",
      parentPresentation: false,
      lessonPlansEnabled: false,
      hasCourse: true,
      firstCourseInProgress: false,
      seen: unseen,
    }),
    null,
  );
});

test("a first course already started this session stays up after the course exists", () => {
  assert.equal(
    selectActiveTour({
      role: "owner",
      parentPresentation: false,
      lessonPlansEnabled: true,
      hasCourse: true,
      firstCourseInProgress: true,
      seen: new Set([TOUR_KEYS.ownerSetup]),
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
      hasCourse: false,
      firstCourseInProgress: false,
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
      firstCourseInProgress: false,
      seen: new Set([TOUR_KEYS.firstCourse]),
    }),
    TOUR_KEYS.lessonPlan,
  );
});

test("lesson plans wait for a course and for the feature flag", () => {
  const base = {
    role: "owner" as const,
    parentPresentation: false,
    firstCourseInProgress: false,
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
        firstCourseInProgress: false,
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
      firstCourseInProgress: false,
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
      firstCourseInProgress: false,
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
  assert.equal(steps[0]?.title, "Create your first course!");
  assert.match(steps[0]?.body ?? "", /we’ll stay with you/);
  assert.match(publish?.body ?? "", /Families can’t see this course until you publish it/);
  assert.equal(publish?.advance, "next");
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
  assert.equal(
    tourLaterKey("user-1", TOUR_KEYS.ownerSetup),
    "cw-product-tour-later:user-1:owner-setup-v1",
  );
  assert.notEqual(
    tourLaterKey("user-1", TOUR_KEYS.ownerSetup),
    tourSessionKey("user-1", TOUR_KEYS.ownerSetup),
  );
});

test("next stays only on point-out steps, including everything after the first material", () => {
  const owner = stepsForTour(TOUR_KEYS.ownerSetup, { orgSlug: "coop", courseId: null });
  const course = stepsForTour(TOUR_KEYS.firstCourse, { orgSlug: "coop", courseId: null });
  const plan = stepsForTour(TOUR_KEYS.lessonPlan, { orgSlug: "coop", courseId: 9 });
  const advance = (steps: typeof owner) => steps.map((step) => [step.anchor, step.advance]);
  assert.deepEqual(advance(owner), [
    [TOUR_ANCHORS.navSettings, "next"],
    [TOUR_ANCHORS.schoolDays, "next"],
    [TOUR_ANCHORS.saveOrganization, "click"],
    [TOUR_ANCHORS.peopleTab, "next"],
    [TOUR_ANCHORS.inviteCollaborator, "submit"],
  ]);
  assert.deepEqual(advance(course), [
    [TOUR_ANCHORS.createCourse, "click"],
    [TOUR_ANCHORS.createCourseForm, "next-anchor"],
    [TOUR_ANCHORS.addUnit, "next-anchor"],
    [TOUR_ANCHORS.addMaterial, "material"],
    [TOUR_ANCHORS.publishCourse, "next"],
  ]);
  assert.deepEqual(advance(plan), [
    [TOUR_ANCHORS.addLessonPlan, "next"],
    [TOUR_ANCHORS.saveLessonPlan, "next"],
    [TOUR_ANCHORS.publishLessonPlan, "next"],
    [TOUR_ANCHORS.previewAsFamily, "next"],
  ]);
  const material = course[3];
  const publish = course[4];
  assert.ok(material && publish);
  assert.equal(shouldAdvanceFromAction(material, { kind: "anchor-click" }), false);
  assert.equal(shouldAdvanceFromAction(material, { kind: "menu-item", label: "Material" }), true);
  assert.equal(shouldAdvanceFromAction(material, { kind: "menu-item", label: "Assignment" }), false);
  assert.equal(shouldAdvanceFromAction(publish, { kind: "anchor-click" }), false);
  assert.equal(shouldAdvanceFromAction(plan[3]!, { kind: "anchor-click" }), false);
  const save = owner[2];
  const invite = owner[4];
  assert.ok(save && invite);
  assert.equal(shouldAdvanceFromAction(save, { kind: "anchor-click" }), true);
  assert.equal(shouldAdvanceFromAction(invite, { kind: "anchor-click" }), false);
  assert.equal(shouldAdvanceFromAction(invite, { kind: "anchor-submit" }), true);
  assert.equal(primaryButtonName(false), "Next");
  assert.equal(primaryButtonName(true), "Done");
  assert.notEqual(primaryButtonName(false), "Close");
});
