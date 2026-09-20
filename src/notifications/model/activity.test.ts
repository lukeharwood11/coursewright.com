import assert from "node:assert/strict";
import { test } from "node:test";
import { activityPath } from "./paths.ts";
import {
  activityMetaParts,
  activityPreview,
  countUnreadActivity,
  isActivityUnread,
  parseActivityKind,
  sortActivityForList,
} from "./activity.ts";

test("activityPath nests under the org", () => {
  assert.equal(activityPath("coop"), "/my/coop/activity");
});

test("parseActivityKind accepts discussion_message only", () => {
  assert.equal(parseActivityKind("discussion_message"), "discussion_message");
  assert.equal(parseActivityKind("announcement"), null);
});

test("unread first then newest", () => {
  const rows = [
    { id: 1, readAt: "2026-01-02T00:00:00Z", createdAt: "2026-01-03T00:00:00Z" },
    { id: 2, readAt: null, createdAt: "2026-01-01T00:00:00Z" },
    { id: 3, readAt: null, createdAt: "2026-01-04T00:00:00Z" },
  ];
  assert.deepEqual(
    sortActivityForList(rows).map((row) => row.id),
    [3, 2, 1],
  );
  assert.equal(countUnreadActivity(rows), 2);
  assert.equal(isActivityUnread({ readAt: null }), true);
  assert.equal(isActivityUnread({ readAt: "2026-01-01T00:00:00Z" }), false);
});

test("activityPreview falls back and truncates", () => {
  assert.equal(activityPreview("  "), "Posted in this discussion.");
  assert.equal(activityPreview("Hello there"), "Hello there");
  const long = "a".repeat(200);
  const preview = activityPreview(long);
  assert.equal(preview.endsWith("…"), true);
  assert.ok(preview.length <= 161);
});

test("activityMetaParts joins actor and audience", () => {
  assert.equal(
    activityMetaParts({ actorName: "Maya", audienceLabel: "Biology" }),
    "Maya · Biology",
  );
  assert.equal(
    activityMetaParts({ actorName: "", audienceLabel: "" }),
    "Someone",
  );
});
