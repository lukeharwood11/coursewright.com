export function announcementsPath(orgSlug: string): string {
  return `/my/${orgSlug}/announcements`;
}

export function announcementPath(orgSlug: string, announcementId: number): string {
  return `${announcementsPath(orgSlug)}/${announcementId}`;
}

export function announcementEditPath(orgSlug: string, announcementId: number): string {
  return `${announcementPath(orgSlug, announcementId)}/edit`;
}

export type NewAnnouncementParams = {
  audience?: "course" | "class" | "student";
  courseId?: number;
  classId?: number;
  studentId?: number;
};

export function newAnnouncementPath(
  orgSlug: string,
  params: NewAnnouncementParams = {},
): string {
  const search = new URLSearchParams();
  if (params.audience) search.set("audience", params.audience);
  if (params.courseId != null) search.set("courseId", String(params.courseId));
  if (params.classId != null) search.set("classId", String(params.classId));
  if (params.studentId != null) search.set("studentId", String(params.studentId));
  const query = search.toString();
  const base = `${announcementsPath(orgSlug)}/new`;
  return query ? `${base}?${query}` : base;
}
