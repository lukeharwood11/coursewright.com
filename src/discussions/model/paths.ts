export function discussionsPath(orgSlug: string): string {
  return `/my/${orgSlug}/discussions`;
}

export function discussionPath(orgSlug: string, discussionId: number): string {
  return `${discussionsPath(orgSlug)}/${discussionId}`;
}

export type NewDiscussionParams = {
  audience?: "course" | "class";
  courseId?: number;
  classId?: number;
};

export function newDiscussionPath(
  orgSlug: string,
  params: NewDiscussionParams = {},
): string {
  const search = new URLSearchParams();
  if (params.audience) search.set("audience", params.audience);
  if (params.courseId != null) search.set("courseId", String(params.courseId));
  if (params.classId != null) search.set("classId", String(params.classId));
  const query = search.toString();
  const base = `${discussionsPath(orgSlug)}/new`;
  return query ? `${base}?${query}` : base;
}
