/**
 * Push copy and deep link. Headlines match `activityHeadline` in
 * src/notifications/model/activity.ts.
 */

export type ActivityPushPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
};

export function activityPushTitle(args: {
  kind: string;
  title: string;
  audienceLabel: string;
}): string {
  const audience = args.audienceLabel.trim();
  const inAudience = audience ? ` in ${audience}` : "";
  if (args.kind === "discussion_mention") {
    const title = args.title.trim() || "Discussion";
    return `Mentioned in ${title}${inAudience}`;
  }
  if (args.kind === "announcement") {
    const name = args.title.trim() || "Announcement";
    return audience ? `Announcement: ${name} in ${audience}` : `Announcement: ${name}`;
  }
  if (args.kind === "discussion_message") {
    const title = args.title.trim() || "Discussion";
    return `New discussion: ${title}${inAudience}`;
  }
  const title = args.title.trim() || "Activity";
  return audience ? `${title} in ${audience}` : title;
}

export function activityPushBody(kind: string, preview: string): string {
  const trimmed = preview.trim();
  if (trimmed) {
    return trimmed.length > 160 ? `${trimmed.slice(0, 160).trimEnd()}…` : trimmed;
  }
  if (kind === "announcement") return "New announcement.";
  return "Posted in this discussion.";
}

/** Same destination as an Activity row, plus `?activity=` so that tap acks the row. */
export function activityPushPath(args: {
  orgSlug: string;
  notificationId: number;
  discussionId: number | null;
  discussionMessageId: number | null;
  announcementId: number | null;
}): string {
  let path = `/my/${args.orgSlug}/activity`;
  if (args.announcementId != null) {
    path = `/my/${args.orgSlug}/announcements/${args.announcementId}`;
  } else if (args.discussionId != null && args.discussionMessageId != null) {
    path = `/my/${args.orgSlug}/discussions/${args.discussionId}#message-${args.discussionMessageId}`;
  } else if (args.discussionId != null) {
    path = `/my/${args.orgSlug}/discussions/${args.discussionId}`;
  }

  const hashAt = path.indexOf("#");
  const before = hashAt === -1 ? path : path.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : path.slice(hashAt);
  return `${before}?activity=${args.notificationId}${hash}`;
}

export function activityPushTag(notificationId: number): string {
  return `activity-${notificationId}`.slice(0, 32);
}

export function activityPushPayload(args: {
  kind: string;
  title: string;
  preview: string;
  audienceLabel: string;
  orgSlug: string;
  notificationId: number;
  discussionId: number | null;
  discussionMessageId: number | null;
  announcementId: number | null;
}): ActivityPushPayload {
  return {
    title: activityPushTitle(args),
    body: activityPushBody(args.kind, args.preview),
    tag: activityPushTag(args.notificationId),
    url: activityPushPath(args),
  };
}
