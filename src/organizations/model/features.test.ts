import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_ORG_FEATURES,
  parseOrgFeatures,
  sameOrgFeatures,
  toggleOrgFeature,
} from "./features.ts";

test("parseOrgFeatures defaults missing rows to all enabled", () => {
  assert.deepEqual(parseOrgFeatures(null), DEFAULT_ORG_FEATURES);
  assert.deepEqual(parseOrgFeatures(undefined), DEFAULT_ORG_FEATURES);
});

test("parseOrgFeatures reads snake_case columns", () => {
  assert.deepEqual(
    parseOrgFeatures({
      discussions_enabled: false,
      announcements_enabled: true,
      resources_enabled: false,
      lesson_plans_enabled: true,
      events_enabled: false,
      calendar_enabled: true,
    }),
    {
      discussions: false,
      announcements: true,
      resources: false,
      lessonPlans: true,
      events: false,
      calendar: true,
    },
  );
});

test("toggleOrgFeature flips one key", () => {
  const next = toggleOrgFeature(DEFAULT_ORG_FEATURES, "calendar");
  assert.equal(next.calendar, false);
  assert.equal(next.discussions, true);
});

test("sameOrgFeatures compares every key", () => {
  assert.equal(sameOrgFeatures(DEFAULT_ORG_FEATURES, DEFAULT_ORG_FEATURES), true);
  assert.equal(
    sameOrgFeatures(DEFAULT_ORG_FEATURES, toggleOrgFeature(DEFAULT_ORG_FEATURES, "events")),
    false,
  );
});
