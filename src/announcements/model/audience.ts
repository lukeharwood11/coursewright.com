export const ANNOUNCEMENT_AUDIENCES = ["course", "class", "student"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export function parseAnnouncementAudience(
  value: string | null | undefined,
): AnnouncementAudience | null {
  if (value === "course" || value === "class" || value === "student") return value;
  return null;
}

export function announcementAudienceLabel(audience: AnnouncementAudience): string {
  if (audience === "course") return "Course";
  if (audience === "class") return "Class";
  return "Student";
}

export function announcementTargetName(item: {
  audience: AnnouncementAudience;
  courseTitle: string | null;
  classTitle: string | null;
  studentName: string | null;
}): string {
  if (item.audience === "course") return item.courseTitle?.trim() || "Course";
  if (item.audience === "class") return item.classTitle?.trim() || "Class";
  return item.studentName?.trim() || "Student";
}
