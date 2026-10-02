export function classAttendancePath(orgSlug: string, classId: number): string {
  return `/my/${orgSlug}/classes/${classId}/attendance`;
}

export function courseAttendancePath(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}/attendance`;
}

export function withAttendanceDate(path: string, onDate: string): string {
  return `${path}?date=${onDate}`;
}
