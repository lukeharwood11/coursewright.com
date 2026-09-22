import assert from "node:assert/strict";
import { test } from "node:test";
import {
  datesForEvent,
  eventOverlapsRange,
  formatEventTime,
  formatEventWhen,
} from "./schedule.ts";
import { validateEventDraft, type EventDraft } from "./validate.ts";

function draft(patch: Partial<EventDraft> = {}): EventDraft {
  return {
    audience: "course",
    courseIds: [1],
    classIds: [],
    title: "Field trip",
    location: "Museum",
    startsOn: "2026-09-22",
    endsOn: "",
    startTime: "",
    endTime: "",
    materialIds: [],
    ...patch,
  };
}

test("a multi-day event occupies each day in the visible range", () => {
  assert.deepEqual(
    datesForEvent("2026-09-22", "2026-09-24", "2026-09-01", "2026-09-30"),
    ["2026-09-22", "2026-09-23", "2026-09-24"],
  );
  assert.equal(eventOverlapsRange("2026-09-22", null, "2026-09-23", "2026-09-29"), false);
});

test("times format for day view and stay blank when unset", () => {
  assert.equal(formatEventTime("09:00:00", "14:30"), "9:00 AM – 2:30 PM");
  assert.equal(formatEventTime("09:00", null), "9:00 AM");
  assert.equal(formatEventTime(null, null), null);
  assert.match(formatEventWhen({
    startsOn: "2026-09-22",
    endsOn: null,
    startTime: "09:00",
    endTime: "14:00",
  }), /9:00 AM – 2:00 PM/);
});

test("location and a coherent schedule are required", () => {
  assert.equal(validateEventDraft(draft({ location: "  " })), "Add a location.");
  assert.equal(
    validateEventDraft(draft({ location: "x".repeat(201) })),
    "Keep the location under 200 characters.",
  );
  assert.equal(
    validateEventDraft(draft({ endsOn: "2026-09-21" })),
    "The end date needs to be on or after the start date.",
  );
  assert.equal(
    validateEventDraft(draft({ startTime: "15:00", endTime: "09:00" })),
    "The end time needs to be at or after the start time.",
  );
  assert.equal(validateEventDraft(draft({ startTime: "09:00", endTime: "14:00" })), null);
  assert.equal(
    validateEventDraft(draft({
      endsOn: "2026-09-24",
      startTime: "15:00",
      endTime: "09:00",
    })),
    null,
  );
});
