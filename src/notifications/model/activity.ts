import {
  parseDiscussionBody,
  plainTextFromDiscussionBody,
} from "@/discussions/model/messageBody";

export type ActivityKind = "discussion_message" | "discussion_mention" | "announcement";

export type ActivityItem = {
  id: number;
  organizationId: number;
  kind: ActivityKind;
  discussionId: number | null;
  discussionMessageId: number | null;
  announcementId: number | null;
  actorId: string | null;
  actorName: string;
  title: string;
  preview: string;
  audienceLabel: string;
  createdAt: string;
  readAt: string | null;
};

export function parseActivityKind(value: string): ActivityKind | null {
  if (
    value === "discussion_message" ||
    value === "discussion_mention" ||
    value === "announcement"
  ) {
    return value;
  }
  return null;
}

export function isActivityUnread(item: { readAt: string | null }): boolean {
  return item.readAt == null;
}

export function countUnreadActivity(
  items: Array<{ readAt: string | null }>,
): number {
  return items.filter(isActivityUnread).length;
}

export const ACTIVITY_BELL_PREVIEW_LIMIT = 3;

export function unreadActivityNewestFirst<
  T extends { readAt: string | null; createdAt: string },
>(items: T[]): T[] {
  return items
    .filter(isActivityUnread)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function activityBellPreview<
  T extends { readAt: string | null; createdAt: string },
>(items: T[]): {
  preview: T[];
  remainingUnread: number;
  unreadCount: number;
} {
  const unread = unreadActivityNewestFirst(items);
  const preview = unread.slice(0, ACTIVITY_BELL_PREVIEW_LIMIT);
  return {
    preview,
    remainingUnread: unread.length - preview.length,
    unreadCount: unread.length,
  };
}

export function remainingUnreadLabel(remaining: number): string | null {
  if (remaining <= 0) return null;
  return `+ ${remaining} unread`;
}

export function sortActivityForList<T extends { readAt: string | null; createdAt: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const aUnread = isActivityUnread(a);
    const bUnread = isActivityUnread(b);
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function activityPreview(preview: string): string {
  const trimmed = readableActivityPreview(preview);
  if (!trimmed) return "Posted in this discussion.";
  return trimmed.length > 160 ? `${trimmed.slice(0, 160).trimEnd()}…` : trimmed;
}

/** Prefer post text when a stored preview is still a Lexical/JSON body dump. */
export function readableActivityPreview(preview: string): string {
  const trimmed = preview.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("{")) return trimmed;
  const parsed = parseDiscussionBody(trimmed);
  const fromBody = plainTextFromDiscussionBody(parsed).trim();
  if (fromBody && fromBody !== trimmed) return fromBody;
  if (/^\{\s*"v"\s*:/.test(trimmed)) return fromBody;
  return trimmed;
}

export function activityHeadline(args: {
  kind: ActivityKind;
  title: string;
  audienceLabel: string;
}): string {
  const title = args.title.trim() || "Discussion";
  const audience = args.audienceLabel.trim();
  const inAudience = audience ? ` in ${audience}` : "";
  if (args.kind === "discussion_mention") {
    return `Mentioned in ${title}${inAudience}`;
  }
  if (args.kind === "announcement") {
    const name = args.title.trim() || "Announcement";
    return audience ? `Announcement: ${name} in ${audience}` : `Announcement: ${name}`;
  }
  return `New discussion: ${title}${inAudience}`;
}

export function activityMetaParts(args: {
  actorName: string;
}): string {
  return args.actorName.trim() || "Someone";
}
