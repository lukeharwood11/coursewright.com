export type StudentProfileInput = {
  name: string;
  parentEmail: string;
  gradeLevel: string;
  gradeLabels: string[];
};

export type ValidatedStudentProfile = {
  name: string;
  parentEmail: string | null;
  gradeLevel: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStudentProfile(
  input: StudentProfileInput,
): { ok: true; value: ValidatedStudentProfile } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const parentEmailRaw = input.parentEmail.trim().toLowerCase();
  let parentEmail: string | null = null;
  if (parentEmailRaw) {
    if (!EMAIL_PATTERN.test(parentEmailRaw)) {
      return { ok: false, error: "Enter a valid parent email, or leave it blank." };
    }
    parentEmail = parentEmailRaw;
  }

  const gradeLevelRaw = input.gradeLevel.trim();
  let gradeLevel: string | null = null;
  if (gradeLevelRaw) {
    if (!input.gradeLabels.includes(gradeLevelRaw)) {
      return { ok: false, error: "Grade must match this organization’s grade scheme." };
    }
    gradeLevel = gradeLevelRaw;
  }

  return { ok: true, value: { name, parentEmail, gradeLevel } };
}

export function studentMatchesQuery(
  student: { name: string; parentEmail: string | null; gradeLevel: string | null },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [student.name, student.parentEmail ?? "", student.gradeLevel ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function studentsNotIn<T extends { id: number }>(
  students: T[],
  memberIds: Iterable<number>,
): T[] {
  const taken = new Set(memberIds);
  return students.filter((student) => !taken.has(student.id));
}

export function rosterWriteErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") {
    return "That student is already on this roster.";
  }
  if (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security")
  ) {
    return "You don’t have permission to change this roster.";
  }
  return error.message;
}
