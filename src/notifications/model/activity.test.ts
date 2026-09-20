import assert from "node:assert/strict";
import { test } from "node:test";
import { activityPath } from "./paths.ts";
import {
  activityBellPreview,
  activityHeadline,
  activityMetaParts,
  activityPreview,
  countUnreadActivity,
  isActivityUnread,
  parseActivityKind,
  remainingUnreadLabel,
  sortActivityForList,
} from "./activity.ts";

test("activityPath nests under the org", () => {
  assert.equal(activityPath("coop"), "/my/coop/activity");
});

test("parseActivityKind accepts discussion kinds", () => {
  assert.equal(parseActivityKind("discussion_message"), "discussion_message");
  assert.equal(parseActivityKind("discussion_mention"), "discussion_mention");
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

test("activity bell previews the three newest unread and names the rest", () => {
  const rows = [
    { id: 1, readAt: null, createdAt: "2026-01-01T00:00:00Z" },
    { id: 2, readAt: "2026-01-02T00:00:00Z", createdAt: "2026-01-05T00:00:00Z" },
    { id: 3, readAt: null, createdAt: "2026-01-03T00:00:00Z" },
    { id: 4, readAt: null, createdAt: "2026-01-04T00:00:00Z" },
    { id: 5, readAt: null, createdAt: "2026-01-02T00:00:00Z" },
  ];
  const preview = activityBellPreview(rows);
  assert.deepEqual(
    preview.preview.map((row) => row.id),
    [4, 3, 5],
  );
  assert.equal(preview.unreadCount, 4);
  assert.equal(preview.remainingUnread, 1);
  assert.equal(remainingUnreadLabel(preview.remainingUnread), "+ 1 unread");
  assert.equal(remainingUnreadLabel(3), "+ 3 unread");
  assert.equal(remainingUnreadLabel(0), null);

  const none = activityBellPreview([
    { id: 1, readAt: "2026-01-02T00:00:00Z", createdAt: "2026-01-05T00:00:00Z" },
  ]);
  assert.deepEqual(none.preview, []);
  assert.equal(none.unreadCount, 0);
  assert.equal(none.remainingUnread, 0);
});

test("activityPreview falls back and truncates", () => {
  assert.equal(activityPreview("  "), "Posted in this discussion.");
  assert.equal(activityPreview("Hello there"), "Hello there");
  const long = "a".repeat(200);
  const preview = activityPreview(long);
  assert.equal(preview.endsWith("…"), true);
  assert.ok(preview.length <= 161);
});

test("activityPreview reads mention text from a Lexical body dump", () => {
  const dump = JSON.stringify({
    v: 1,
    format: "lexical",
    lexical: {
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "mention",
                text: "@Luke Harwood",
                userId: "u1",
              },
            ],
          },
        ],
      },
    },
  });
  assert.equal(activityPreview(dump), "@Luke Harwood");
});

test("activityHeadline names the activity and place", () => {
  assert.equal(
    activityHeadline({
      kind: "discussion_message",
      title: "Field trip",
      audienceLabel: "Biology",
    }),
    "New discussion: Field trip in Biology",
  );
  assert.equal(
    activityHeadline({
      kind: "discussion_mention",
      title: "Field trip",
      audienceLabel: "Biology",
    }),
    "Mentioned in Field trip in Biology",
  );
  assert.equal(
    activityHeadline({
      kind: "discussion_message",
      title: "  ",
      audienceLabel: "",
    }),
    "New discussion: Discussion",
  );
});

test("activityMetaParts uses the actor name", () => {
  assert.equal(activityMetaParts({ actorName: "Maya" }), "Maya");
  assert.equal(activityMetaParts({ actorName: "" }), "Someone");
});
