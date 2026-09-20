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
