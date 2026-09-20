import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarPath, parseCalendarView } from "./paths.ts";

test("parseCalendarView defaults to month", () => {
  assert.equal(parseCalendarView(null), "month");
  assert.equal(parseCalendarView("week"), "week");
  assert.equal(parseCalendarView("day"), "day");
});

test("calendarPath omits month view from the query", () => {
  assert.equal(calendarPath("demo"), "/my/demo/calendar");
  assert.equal(
    calendarPath("demo", { view: "day", date: "2026-09-20" }),
    "/my/demo/calendar?view=day&date=2026-09-20",
  );
});
