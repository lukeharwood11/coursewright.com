import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPastOrgInstructionWeek,
  lastOrgInstructionDayInWeek,
} from "./orgInstructionDays.ts";
import { DEFAULT_SCHOOL_DAYS } from "./schoolDays.ts";

describe("lastOrgInstructionDayInWeek", () => {
  it("uses the latest school or home day in the Sun–Sat week", () => {
    assert.equal(
      lastOrgInstructionDayInWeek("2026-09-13", DEFAULT_SCHOOL_DAYS, [6]),
      "2026-09-19",
    );
    assert.equal(
      lastOrgInstructionDayInWeek("2026-09-13", DEFAULT_SCHOOL_DAYS, []),
      "2026-09-18",
    );
  });
});

describe("isPastOrgInstructionWeek", () => {
  it("is true after the last school day when there are no home days", () => {
    assert.equal(
      isPastOrgInstructionWeek("2026-09-13", DEFAULT_SCHOOL_DAYS, [], "2026-09-18"),
      false,
    );
    assert.equal(
      isPastOrgInstructionWeek("2026-09-13", DEFAULT_SCHOOL_DAYS, [], "2026-09-19"),
      true,
    );
  });

  it("waits until after the last home day when Saturday is home", () => {
    assert.equal(
      isPastOrgInstructionWeek("2026-09-13", DEFAULT_SCHOOL_DAYS, [6], "2026-09-19"),
      false,
    );
    assert.equal(
      isPastOrgInstructionWeek("2026-09-13", DEFAULT_SCHOOL_DAYS, [6], "2026-09-20"),
      true,
    );
  });
});
