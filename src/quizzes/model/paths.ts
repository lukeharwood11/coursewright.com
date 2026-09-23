export function quizPath(args: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  quizId: number;
}): string {
  if (args.unitId != null) {
    return `/my/${args.orgSlug}/courses/${args.courseId}/units/${args.unitId}/quizzes/${args.quizId}`;
  }
  return `/my/${args.orgSlug}/courses/${args.courseId}/quizzes/${args.quizId}`;
}

export function quizEditPath(args: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  quizId: number;
}): string {
  return `${quizPath(args)}/edit`;
}

export function quizPrintPath(args: {
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  quizId: number;
}): string {
  return `${quizPath(args)}/print`;
}
