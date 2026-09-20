export function discussionsPath(orgSlug: string): string {
  return `/my/${orgSlug}/discussions`;
}

export function discussionPath(orgSlug: string, discussionId: number): string {
  return `${discussionsPath(orgSlug)}/${discussionId}`;
}

export function discussionMessagePath(
  orgSlug: string,
  discussionId: number,
  messageId: number,
): string {
  return `${discussionPath(orgSlug, discussionId)}#message-${messageId}`;
}

export function discussionMessageElementId(messageId: number): string {
  return `message-${messageId}`;
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
