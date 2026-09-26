import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  orgHomePath,
  parseOrgHomeWeekParam,
  parseOrgHomeWeekSearch,
  resolveOrgHomeWeek,
} from "./orgHomeWeek.ts";
import {
  calendarWeekForIsoDate,
  effectiveViewAsOfDate,
  isCurrentCalendarWeek,
  shiftCalendarWeek,
} from "./thisWeek.ts";

describe("calendarWeekForIsoDate", () => {
  it("returns the Sun–Sat week containing the date", () => {
    const week = calendarWeekForIsoDate("2026-09-17");
    assert.equal(week.start, "2026-09-13");
    assert.equal(week.end, "2026-09-19");
  });
});

describe("shiftCalendarWeek", () => {
  it("moves by whole weeks", () => {
    assert.equal(shiftCalendarWeek("2026-09-13", 1), "2026-09-20");
    assert.equal(shiftCalendarWeek("2026-09-13", -1), "2026-09-06");
  });
});

describe("effectiveViewAsOfDate", () => {
  it("uses week start when not the current week", () => {
    const week = calendarWeekForIsoDate("2026-10-04");
    assert.equal(
      effectiveViewAsOfDate(week, new Date("2026-09-15T12:00:00")),
      "2026-10-04",
    );
  });

  it("uses today when viewing the current week", () => {
    const now = new Date("2026-09-15T12:00:00");
    const week = calendarWeekForIsoDate("2026-09-14");
    assert.equal(isCurrentCalendarWeek(week, now), true);
    assert.equal(effectiveViewAsOfDate(week, now), "2026-09-15");
  });
});

describe("parseOrgHomeWeekParam", () => {
  it("accepts a Sunday ISO date", () => {
    assert.equal(parseOrgHomeWeekParam("2026-09-13"), "2026-09-13");
  });

  it("rejects non-Sundays and invalid values", () => {
    assert.equal(parseOrgHomeWeekParam("2026-09-14"), null);
    assert.equal(parseOrgHomeWeekParam("bad"), null);
    assert.equal(parseOrgHomeWeekParam(null), null);
  });
});

describe("orgHomePath", () => {
  it("omits query for current week", () => {
    assert.equal(orgHomePath("demo"), "/my/demo");
    assert.equal(orgHomePath("demo", { weekStart: null }), "/my/demo");
  });

  it("includes week for a valid Sunday", () => {
    assert.equal(orgHomePath("demo", { weekStart: "2026-09-20" }), "/my/demo?week=2026-09-20");
  });
});

describe("parseOrgHomeWeekSearch", () => {
  it("reads week from search", () => {
    assert.equal(parseOrgHomeWeekSearch("?week=2026-09-20"), "2026-09-20");
    assert.equal(parseOrgHomeWeekSearch(""), null);
  });
});

describe("resolveOrgHomeWeek", () => {
  it("falls back to current week when param invalid", () => {
    const week = resolveOrgHomeWeek("2026-09-14");
    assert.equal(week.start, resolveOrgHomeWeek(null).start);
  });
});
