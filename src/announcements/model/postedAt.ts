/** Local calendar date for when the announcement was posted (`created_at`). */
export function formatAnnouncementPostedAt(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function announcementPostedLabel(isoTimestamp: string): string {
  const formatted = formatAnnouncementPostedAt(isoTimestamp);
  return formatted ? `Posted ${formatted}` : "";
}

export function announcementAuthorLabel(authorName: string): string {
  const name = authorName.trim();
  return name ? `From ${name}` : "";
}

/** Meta bits for list rows: author · posted · optional date range. */
export function announcementMetaParts(args: {
  authorName?: string;
  createdAt?: string;
  dateRange?: string | null;
  audienceLabel?: string;
}): string[] {
  const parts: string[] = [];
  if (args.audienceLabel) parts.push(args.audienceLabel);
  if (args.authorName) {
    const author = announcementAuthorLabel(args.authorName);
    if (author) parts.push(author);
  }
  if (args.createdAt) {
    const posted = announcementPostedLabel(args.createdAt);
    if (posted) parts.push(posted);
  }
  if (args.dateRange) parts.push(args.dateRange);
  return parts;
}
