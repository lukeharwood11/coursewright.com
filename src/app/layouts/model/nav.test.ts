import assert from "node:assert/strict";
import { test } from "node:test";
import { buildParentNav, buildStaffNav } from "./nav.ts";

test("staff nav includes announcements; parent nav does not", () => {
  const staff = buildStaffNav("coop", { courses: [], classes: [] });
  assert.deepEqual(
    staff.map((section) => section.id),
    ["home", "calendar", "announcements", "courses", "roster", "settings"],
  );
  assert.equal(
    staff.find((section) => section.id === "announcements")?.href,
    "/my/coop/announcements",
  );

  const parent = buildParentNav("coop", { courses: [], classes: [] });
  assert.equal(
    parent.some((section) => section.id === "announcements"),
    false,
  );
});
