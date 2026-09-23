import assert from "node:assert/strict";
import { test } from "node:test";
import { buildAccountNav, buildLearnerNav, buildParentNav, buildStaffNav } from "./nav.ts";

test("staff and parent nav include announcements and discussions, not activity", () => {
  const staff = buildStaffNav("coop", { courses: [], classes: [] });
  assert.deepEqual(
    staff.map((section) => section.id),
    [
      "home",
      "calendar",
      "announcements",
      "discussions",
      "courses",
      "students",
      "resources",
      "settings",
    ],
  );
  assert.equal(
    staff.find((section) => section.id === "announcements")?.href,
    "/my/coop/announcements",
  );
  assert.equal(
    staff.find((section) => section.id === "discussions")?.href,
    "/my/coop/discussions",
  );
  assert.equal(
    staff.find((section) => section.id === "activity"),
    undefined,
  );

  const parent = buildParentNav("coop", { courses: [], classes: [] });
  assert.deepEqual(
    parent.map((section) => section.id),
    ["home", "calendar", "announcements", "discussions", "courses", "students"],
  );
  assert.equal(
    parent.find((section) => section.id === "courses")?.href,
    "/my/coop/courses",
  );
  assert.deepEqual(
    parent.find((section) => section.id === "courses")?.children ?? [],
    [],
  );
  assert.equal(
    parent.find((section) => section.id === "announcements")?.href,
    "/my/coop/announcements",
  );
  assert.equal(
    parent.find((section) => section.id === "discussions")?.href,
    "/my/coop/discussions",
  );
  assert.equal(
    parent.find((section) => section.id === "activity"),
    undefined,
  );
  assert.equal(
    parent.find((section) => section.id === "announcements")?.badgeCount,
    undefined,
  );
});

test("parent announcements nav shows unread badge count", () => {
  const parent = buildParentNav(
    "coop",
    { courses: [], classes: [] },
    { unreadAnnouncements: 3 },
  );
  assert.equal(
    parent.find((section) => section.id === "announcements")?.badgeCount,
    3,
  );

  const none = buildParentNav(
    "coop",
    { courses: [], classes: [] },
    { unreadAnnouncements: 0 },
  );
  assert.equal(
    none.find((section) => section.id === "announcements")?.badgeCount,
    undefined,
  );
});

test("discussions nav shows unread badge count for staff and parents", () => {
  const staff = buildStaffNav(
    "coop",
    { courses: [], classes: [] },
    { unreadDiscussions: 2 },
  );
  assert.equal(
    staff.find((section) => section.id === "discussions")?.badgeCount,
    2,
  );

  const parent = buildParentNav(
    "coop",
    { courses: [], classes: [] },
    { unreadDiscussions: 4 },
  );
  assert.equal(
    parent.find((section) => section.id === "discussions")?.badgeCount,
    4,
  );
});

test("staff courses collapse past five items and Students has no class children", () => {
  const courses = Array.from({ length: 7 }, (_, i) => ({
    id: String(i + 1),
    title: `Course ${i + 1}`,
  }));
  const classes = Array.from({ length: 6 }, (_, i) => ({
    id: String(i + 1),
    title: `Class ${i + 1}`,
  }));

  const staff = buildStaffNav("coop", { courses, classes });
  const courseChildren = staff.find((section) => section.id === "courses")?.children ?? [];
  const studentChildren = staff.find((section) => section.id === "students")?.children ?? [];

  assert.equal(courseChildren.length, 6);
  assert.deepEqual(
    courseChildren.map((child) => child.label),
    ["Course 1", "Course 2", "Course 3", "Course 4", "Course 5", "+ 2 others"],
  );
  assert.equal(courseChildren.at(-1)?.href, "/my/coop/courses");

  assert.equal(studentChildren.length, 0);
  assert.equal(staff.find((section) => section.id === "students")?.href, "/my/coop/students");
  assert.equal(staff.find((section) => section.id === "roster"), undefined);
});

test("staff nav shows all children when five or fewer", () => {
  const staff = buildStaffNav("coop", {
    courses: [
      { id: "1", title: "Algebra" },
      { id: "2", title: "History" },
    ],
    classes: [{ id: "1", title: "Cohort A" }],
  });

  assert.deepEqual(
    staff.find((section) => section.id === "courses")?.children.map((c) => c.label),
    ["Algebra", "History"],
  );
  assert.deepEqual(
    staff.find((section) => section.id === "students")?.children ?? [],
    [],
  );
});

test("account nav keeps an org icon beside the name", () => {
  const nav = buildAccountNav([
    { id: 4, name: "Oak Co-op", slug: "oak", iconUrl: "https://example.com/icon.png" },
    { id: 5, name: "Pine School", slug: "pine" },
  ]);
  const orgs = nav[0]?.children ?? [];
  assert.equal(orgs[0]?.iconUrl, "https://example.com/icon.png");
  assert.equal(orgs[1]?.iconUrl, undefined);
});

test("parent courses nav links to the list and nests enrolled courses", () => {
  const parent = buildParentNav("coop", {
    courses: [
      { id: "1", title: "Algebra" },
      { id: "2", title: "History" },
    ],
    classes: [],
  });
  const courses = parent.find((section) => section.id === "courses");
  assert.equal(courses?.href, "/my/coop/courses");
  assert.deepEqual(
    courses?.children.map((child) => child.label),
    ["Algebra", "History"],
  );
});

test("parent nav includes resources when the parent can see any", () => {
  const hidden = buildParentNav("coop", { courses: [], classes: [] });
  assert.equal(
    hidden.find((section) => section.id === "resources"),
    undefined,
  );
  const shown = buildParentNav(
    "coop",
    { courses: [], classes: [] },
    { showResources: true },
  );
  assert.equal(
    shown.find((section) => section.id === "resources")?.href,
    "/my/coop/resources",
  );
  assert.equal(shown.at(-1)?.id, "resources");
});

test("staff and parent nav omit disabled feature sections", () => {
  const staff = buildStaffNav(
    "coop",
    { courses: [], classes: [] },
    {
      calendar: false,
      announcements: false,
      discussions: false,
      resources: false,
    },
  );
  assert.deepEqual(
    staff.map((section) => section.id),
    ["home", "courses", "students", "settings"],
  );

  const parent = buildParentNav(
    "coop",
    { courses: [], classes: [] },
    {
      calendar: false,
      announcements: false,
      discussions: false,
      resources: false,
      showResources: true,
    },
  );
  assert.deepEqual(
    parent.map((section) => section.id),
    ["home", "courses", "students"],
  );
});

test("learners get Progress and parents get Students", () => {
  const learner = buildLearnerNav("coop", { courses: [], classes: [] });
  assert.equal(learner.find((section) => section.id === "progress")?.href, "/my/coop/progress");
  assert.equal(learner.find((section) => section.id === "students"), undefined);
  const parent = buildParentNav("coop", { courses: [], classes: [] });
  assert.equal(parent.find((section) => section.id === "students")?.label, "Students");
  assert.equal(parent.find((section) => section.id === "progress"), undefined);
});
