export const DISCUSSION_AUDIENCES = ["course", "class", "organization"] as const;
export type DiscussionAudience = (typeof DISCUSSION_AUDIENCES)[number];

export const DISCUSSION_FAMILY_AUDIENCES = ["parents", "students", "both"] as const;
export type DiscussionFamilyAudience = (typeof DISCUSSION_FAMILY_AUDIENCES)[number];

export function parseDiscussionAudience(
  value: string | null | undefined,
): DiscussionAudience | null {
  if (value === "course" || value === "class" || value === "organization") {
    return value;
  }
  return null;
}

export function parseDiscussionFamilyAudience(
  value: string | null | undefined,
): DiscussionFamilyAudience {
  if (value === "parents" || value === "students") return value;
  return "both";
}

export function discussionAudienceLabel(audience: DiscussionAudience): string {
  if (audience === "course") return "Course";
  if (audience === "class") return "Class";
  return "Organization";
}

export function discussionFamilyAudienceLabel(
  familyAudience: DiscussionFamilyAudience,
): string {
  if (familyAudience === "parents") return "Parents";
  if (familyAudience === "students") return "Students";
  return "Both";
}

export function discussionTargetName(item: {
  audience: DiscussionAudience;
  organizationName?: string | null;
  courseTitle: string | null;
  classTitle: string | null;
}): string {
  if (item.audience === "organization") {
    const name = item.organizationName?.trim();
    return name ? `Everyone in ${name}` : "Organization";
  }
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
  if (filter === "answered") return "Resolved";
  return "All";
}

export function discussionStatusLabel(answeredAt: string | null): string {
  return answeredAt ? "Resolved" : "Open";
}
