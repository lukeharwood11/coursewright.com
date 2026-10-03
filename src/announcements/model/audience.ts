export const ANNOUNCEMENT_AUDIENCES = ["course", "class", "student", "instructors"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export function parseAnnouncementAudience(
  value: string | null | undefined,
): AnnouncementAudience | null {
  if (
    value === "course" ||
    value === "class" ||
    value === "student" ||
    value === "instructors"
  ) {
    return value;
  }
  return null;
}

export function announcementAudienceLabel(audience: AnnouncementAudience): string {
  if (audience === "course") return "Course";
  if (audience === "class") return "Class";
  if (audience === "instructors") return "Instructors";
  return "Student";
}

export function announcementAudienceVisibilityHint(audience: AnnouncementAudience): string {
  if (audience === "course") {
    return "Parents and students enrolled in the courses you pick see this on home during the date window.";
  }
  if (audience === "class") {
    return "Parents and students in the classes you pick see this on home during the date window.";
  }
  if (audience === "student") {
    return "The students you pick and their linked parents see this on home during the date window.";
  }
  return "Only org collaborators — owners, admins, instructors, and observers. It does not appear on student home.";
}

export function announcementAudienceVisibilityHintLabel(
  audience: AnnouncementAudience,
): string {
  return `Who can see a ${announcementAudienceLabel(audience).toLowerCase()} announcement`;
}

export function announcementTargetNames(item: {
  audience: AnnouncementAudience;
  courseTitles: string[];
  classTitles: string[];
  studentNames: string[];
}): string[] {
  if (item.audience === "course") return cleanTargetNames(item.courseTitles);
  if (item.audience === "class") return cleanTargetNames(item.classTitles);
  if (item.audience === "instructors") return ["Instructors"];
  return cleanTargetNames(item.studentNames);
}

export function announcementTargetName(item: {
  audience: AnnouncementAudience;
  courseTitles: string[];
  classTitles: string[];
  studentNames: string[];
}): string {
  return formatTargetNames(
    announcementTargetNames(item),
    announcementAudienceLabel(item.audience),
  );
}

/** Truncated preview: first two names, then “and N others”. */
export function announcementTargetSummary(
  names: string[],
  fallback = "Audience",
): string {
  const cleaned = cleanTargetNames(names);
  if (cleaned.length === 0) return fallback;
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  const remaining = cleaned.length - 2;
  const others = remaining === 1 ? "1 other" : `${remaining} others`;
  return `${cleaned[0]}, ${cleaned[1]} and ${others}`;
}

export function announcementTargetList(
  names: string[],
  fallback = "Audience",
): string {
  return formatTargetNames(names, fallback);
}

function cleanTargetNames(names: string[]): string[] {
  return names.map((name) => name.trim()).filter(Boolean);
}

function formatTargetNames(names: string[], fallback: string): string {
  const cleaned = cleanTargetNames(names);
  if (cleaned.length === 0) return fallback;
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
}
