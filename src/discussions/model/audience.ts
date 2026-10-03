export const DISCUSSION_AUDIENCES = ["course", "class", "organization", "instructors"] as const;
export type DiscussionAudience = (typeof DISCUSSION_AUDIENCES)[number];

export const DISCUSSION_FAMILY_AUDIENCES = ["parents", "students", "both"] as const;
export type DiscussionFamilyAudience = (typeof DISCUSSION_FAMILY_AUDIENCES)[number];

export function parseDiscussionAudience(
  value: string | null | undefined,
): DiscussionAudience | null {
  if (
    value === "course" ||
    value === "class" ||
    value === "organization" ||
    value === "instructors"
  ) {
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
  if (audience === "instructors") return "Instructors";
  return "Organization";
}

export function discussionFamilyAudienceLabel(
  familyAudience: DiscussionFamilyAudience,
): string {
  if (familyAudience === "parents") return "Parents";
  if (familyAudience === "students") return "Students";
  return "Both";
}

export function discussionAudienceVisibilityHint(audience: DiscussionAudience): string {
  if (audience === "course") {
    return "Org staff and course instructors can see and post. Families enrolled in the course you pick can join the thread.";
  }
  if (audience === "class") {
    return "Org staff and class leads can see and post. Parents and students in that class can join the thread.";
  }
  if (audience === "instructors") {
    return "Only org collaborators — owners, admins, instructors, and observers. Families are not included.";
  }
  return "Org staff can always see and post. Which families can join depends on who in families can see this below.";
}

export function discussionFamilyAudienceVisibilityHint(
  familyAudience: DiscussionFamilyAudience,
): string {
  if (familyAudience === "parents") {
    return "Parents linked to the audience can see and post. Student accounts are not included.";
  }
  if (familyAudience === "students") {
    return "Student accounts in the audience can see and post. Parent accounts are not included.";
  }
  return "Parents and student accounts in the audience can see and post. Staff can always see and post.";
}

export function discussionAudienceVisibilityHintLabel(
  audience: DiscussionAudience,
): string {
  return `Who can see a ${discussionAudienceLabel(audience).toLowerCase()} discussion`;
}

export function discussionFamilyAudienceVisibilityHintLabel(
  familyAudience: DiscussionFamilyAudience,
): string {
  return `Family visibility: ${discussionFamilyAudienceLabel(familyAudience).toLowerCase()}`;
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
  if (item.audience === "instructors") {
    return "Instructors";
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
