export function formatDiscussionActivityAt(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** True when the body was edited after create (ignores soft-delete bumps). */
export function isDiscussionMessageEdited(args: {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}): boolean {
  if (args.deletedAt != null) return false;
  const created = Date.parse(args.createdAt);
  const updated = Date.parse(args.updatedAt);
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;
  return updated > created;
}

export function formatDiscussionMessageTime(args: {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}): string {
  const time = formatDiscussionActivityAt(args.createdAt);
  if (!time) return "";
  return isDiscussionMessageEdited(args) ? `${time} (edited)` : time;
}

export function discussionStartedLabel(isoTimestamp: string): string {
  const formatted = formatDiscussionActivityAt(isoTimestamp);
  return formatted ? `Started ${formatted}` : "";
}

export function discussionActivityLabel(isoTimestamp: string): string {
  const formatted = formatDiscussionActivityAt(isoTimestamp);
  return formatted ? `Last activity ${formatted}` : "";
}

export function discussionAuthorLabel(authorName: string): string {
  const name = authorName.trim();
  return name ? `Started by ${name}` : "";
}
