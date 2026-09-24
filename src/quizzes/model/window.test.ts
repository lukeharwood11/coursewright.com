import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyWindowFromDate,
  applyWindowUntilDate,
  DEFAULT_WINDOW_FROM_TIME,
  DEFAULT_WINDOW_UNTIL_TIME,
  emptyWindowFields,
} from "./window";

describe("applyWindowFromDate", () => {
  it("defaults time to midnight when a date is set with no time", () => {
    const next = applyWindowFromDate(emptyWindowFields(), "2026-09-23");
    assert.equal(next.fromDate, "2026-09-23");
    assert.equal(next.fromTime, DEFAULT_WINDOW_FROM_TIME);
  });

  it("keeps an existing start time when the date changes", () => {
    const next = applyWindowFromDate(
      { ...emptyWindowFields(), fromDate: "2026-09-22", fromTime: "08:30" },
      "2026-09-23",
    );
    assert.equal(next.fromDate, "2026-09-23");
    assert.equal(next.fromTime, "08:30");
  });

  it("clears the time when the date is cleared", () => {
    const next = applyWindowFromDate(
      { ...emptyWindowFields(), fromDate: "2026-09-23", fromTime: "00:00" },
      "",
    );
    assert.equal(next.fromDate, "");
    assert.equal(next.fromTime, "");
  });
});

describe("applyWindowUntilDate", () => {
  it("defaults time to 11:59 PM when a date is set with no time", () => {
    const next = applyWindowUntilDate(emptyWindowFields(), "2026-09-30");
    assert.equal(next.untilDate, "2026-09-30");
    assert.equal(next.untilTime, DEFAULT_WINDOW_UNTIL_TIME);
  });

  it("keeps an existing until time when the date changes", () => {
    const next = applyWindowUntilDate(
      { ...emptyWindowFields(), untilDate: "2026-09-29", untilTime: "15:00" },
      "2026-09-30",
    );
    assert.equal(next.untilDate, "2026-09-30");
    assert.equal(next.untilTime, "15:00");
  });

  it("clears the time when the date is cleared", () => {
    const next = applyWindowUntilDate(
      { ...emptyWindowFields(), untilDate: "2026-09-30", untilTime: "23:59" },
      "",
    );
    assert.equal(next.untilDate, "");
    assert.equal(next.untilTime, "");
  });
});
