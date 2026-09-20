export const DISCUSSION_AUDIENCES = ["course", "class"] as const;
export type DiscussionAudience = (typeof DISCUSSION_AUDIENCES)[number];

export function parseDiscussionAudience(
  value: string | null | undefined,
): DiscussionAudience | null {
  if (value === "course" || value === "class") return value;
  return null;
}

export function discussionAudienceLabel(audience: DiscussionAudience): string {
  return audience === "course" ? "Course" : "Class";
}

export function discussionTargetName(item: {
  audience: DiscussionAudience;
  courseTitle: string | null;
  classTitle: string | null;
}): string {
  if (item.audience === "course") {
    const title = item.courseTitle?.trim();
    return title || "Course";
  }
  const title = item.classTitle?.trim();
  return title || "Class";
}

export const DISCUSSION_FILTERS = ["all", "open", "answered"] as const;
export type DiscussionFilter = (typeof DISCUSSION_FILTERS)[number];

export function parseDiscussionFilter(
  value: string | null | undefined,
): DiscussionFilter {
  if (value === "open" || value === "answered") return value;
  return "all";
}

export function discussionFilterLabel(filter: DiscussionFilter): string {
  if (filter === "open") return "Open";
  if (filter === "answered") return "Answered";
  return "All";
}

export function discussionStatusLabel(answeredAt: string | null): string {
  return answeredAt ? "Answered" : "Open";
}
