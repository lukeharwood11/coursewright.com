export function eventPath(orgSlug: string, eventId: number): string {
  return `/my/${orgSlug}/events/${eventId}`;
}

export function eventEditPath(orgSlug: string, eventId: number): string {
  return `${eventPath(orgSlug, eventId)}/edit`;
}

export function eventPrintPath(orgSlug: string, eventId: number): string {
  return `${eventPath(orgSlug, eventId)}/print`;
}

export type NewEventParams = {
  audience?: "course" | "class" | "organization";
  courseId?: number;
  classId?: number;
  date?: string;
};

export function newEventPath(orgSlug: string, params: NewEventParams = {}): string {
  const search = new URLSearchParams();
  if (params.audience) search.set("audience", params.audience);
  if (params.courseId != null) search.set("courseId", String(params.courseId));
  if (params.classId != null) search.set("classId", String(params.classId));
  if (params.date) search.set("date", params.date);
  const query = search.toString();
  const base = `/my/${orgSlug}/events/new`;
  return query ? `${base}?${query}` : base;
}
