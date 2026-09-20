export type ActivityKind = "discussion_message";

export type ActivityItem = {
  id: number;
  organizationId: number;
  kind: ActivityKind;
  discussionId: number | null;
  discussionMessageId: number | null;
  actorId: string | null;
  actorName: string;
  title: string;
  preview: string;
  audienceLabel: string;
  createdAt: string;
  readAt: string | null;
};

export function parseActivityKind(value: string): ActivityKind | null {
  if (value === "discussion_message") return value;
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
  const trimmed = preview.trim();
  if (!trimmed) return "Posted in this discussion.";
  return trimmed.length > 160 ? `${trimmed.slice(0, 160).trimEnd()}…` : trimmed;
}

export function activityMetaParts(args: {
  actorName: string;
  audienceLabel: string;
}): string {
  const actor = args.actorName.trim() || "Someone";
  const audience = args.audienceLabel.trim();
  return audience ? `${actor} · ${audience}` : actor;
}
