import assert from "node:assert/strict";
import { test } from "node:test";
import { activityHeadline } from "../../../src/notifications/model/activity.ts";
import {
  activityPushBody,
  activityPushPath,
  activityPushTag,
  activityPushTitle,
} from "./payload.ts";

test("push headlines match Activity", () => {
  const cases = [
    { kind: "discussion_message" as const, title: "Field trip", audienceLabel: "Biology" },
    { kind: "discussion_mention" as const, title: "Field trip", audienceLabel: "Biology" },
    { kind: "discussion_message" as const, title: "  ", audienceLabel: "" },
    { kind: "announcement" as const, title: "No school Friday", audienceLabel: "Homeroom" },
    { kind: "announcement" as const, title: "No school Friday", audienceLabel: "" },
  ];
  for (const item of cases) {
    assert.equal(activityPushTitle(item), activityHeadline(item));
  }
});

test("push body falls back and truncates", () => {
  assert.equal(activityPushBody("discussion_message", "  "), "Posted in this discussion.");
  assert.equal(activityPushBody("announcement", ""), "New announcement.");
  assert.equal(activityPushBody("discussion_message", "Hello"), "Hello");
  const body = activityPushBody("discussion_message", "a".repeat(200));
  assert.equal(body.endsWith("…"), true);
  assert.ok(body.length <= 161);
});

test("push path opens the same item and acks that row", () => {
  assert.equal(
    activityPushPath({
      orgSlug: "coop",
      notificationId: 9,
      discussionId: 4,
      discussionMessageId: 12,
      announcementId: null,
    }),
    "/my/coop/discussions/4?activity=9#message-12",
  );
  assert.equal(
    activityPushPath({
      orgSlug: "coop",
      notificationId: 3,
      discussionId: 4,
      discussionMessageId: null,
      announcementId: null,
    }),
    "/my/coop/discussions/4?activity=3",
  );
  assert.equal(
    activityPushPath({
      orgSlug: "coop",
      notificationId: 8,
      discussionId: null,
      discussionMessageId: null,
      announcementId: 15,
    }),
    "/my/coop/announcements/15?activity=8",
  );
  assert.equal(
    activityPushPath({
      orgSlug: "coop",
      notificationId: 1,
      discussionId: null,
      discussionMessageId: null,
      announcementId: null,
    }),
    "/my/coop/activity?activity=1",
  );
  assert.equal(activityPushTag(42), "activity-42");
});
