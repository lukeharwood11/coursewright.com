import assert from "node:assert/strict";
import { test } from "node:test";
import { buildParentNav, buildStaffNav } from "./nav.ts";

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
      "roster",
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
    ["home", "calendar", "announcements", "discussions", "progress"],
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

test("staff courses and roster collapse past five items with +N others", () => {
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
  const rosterChildren = staff.find((section) => section.id === "roster")?.children ?? [];

  assert.equal(courseChildren.length, 6);
  assert.deepEqual(
    courseChildren.map((child) => child.label),
    ["Course 1", "Course 2", "Course 3", "Course 4", "Course 5", "+ 2 others"],
  );
  assert.equal(courseChildren.at(-1)?.href, "/my/coop/courses");

  assert.equal(rosterChildren.length, 6);
  assert.equal(rosterChildren.at(-1)?.label, "+ 1 other");
  assert.equal(rosterChildren.at(-1)?.href, "/my/coop/roster");
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
    staff.find((section) => section.id === "roster")?.children.map((c) => c.label),
    ["Cohort A"],
  );
});
