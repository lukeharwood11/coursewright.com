export function studentsPath(orgSlug: string): string {
  return `/my/${orgSlug}/students`;
}

export function studentsClassesPath(orgSlug: string): string {
  return `/my/${orgSlug}/students?tab=classes`;
}

export function studentPath(orgSlug: string, studentId: number): string {
  return `/my/${orgSlug}/students/${studentId}`;
}

export function progressPath(orgSlug: string): string {
  return `/my/${orgSlug}/progress`;
}

export function gradebookPath(orgSlug: string, courseId: number): string {
  return `/my/${orgSlug}/courses/${courseId}/gradebook`;
}

export function reportCardPath(orgSlug: string, cardId: number): string {
  return `/my/${orgSlug}/report-cards/${cardId}`;
}

export function gradingSettingsPath(orgSlug: string): string {
  return `/my/${orgSlug}/settings?tab=grading`;
}
