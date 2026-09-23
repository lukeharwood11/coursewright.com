export type StudentProfileInput = {
  name: string;
  parentEmail: string;
  studentEmail: string;
  gradeLevel: string;
  gradeLabels: string[];
};

export type ValidatedStudentProfile = {
  name: string;
  parentEmail: string | null;
  studentEmail: string | null;
  gradeLevel: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StudentProfileDraft = {
  name: string;
  parentEmail: string;
  studentEmail: string;
  gradeLevel: string;
};

export type StudentProfileSaved = {
  name: string;
  parentEmail: string | null;
  studentEmail: string | null;
  gradeLevel: string | null;
};

/** True when the draft differs from the saved student profile. */
export function studentProfileHaveChanges(
  draft: StudentProfileDraft,
  saved: StudentProfileSaved,
): boolean {
  if (draft.name.trim() !== saved.name) return true;
  if (draft.parentEmail.trim().toLowerCase() !== (saved.parentEmail ?? "")) {
    return true;
  }
  if (draft.studentEmail.trim().toLowerCase() !== (saved.studentEmail ?? "")) {
    return true;
  }
  if (draft.gradeLevel.trim() !== (saved.gradeLevel ?? "")) return true;
  return false;
}

function parseOptionalEmail(
  raw: string,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const email = raw.trim().toLowerCase();
  if (!email) return { ok: true, value: null };
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: `Enter a valid ${label}, or leave it blank.` };
  }
  return { ok: true, value: email };
}

export function validateStudentProfile(
  input: StudentProfileInput,
): { ok: true; value: ValidatedStudentProfile } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  const parentEmail = parseOptionalEmail(input.parentEmail, "parent email");
  if (!parentEmail.ok) return parentEmail;

  const studentEmail = parseOptionalEmail(input.studentEmail, "student email");
  if (!studentEmail.ok) return studentEmail;

  const gradeLevelRaw = input.gradeLevel.trim();
  let gradeLevel: string | null = null;
  if (gradeLevelRaw) {
    if (!input.gradeLabels.includes(gradeLevelRaw)) {
      return { ok: false, error: "Pick a grade from this organization’s list." };
    }
    gradeLevel = gradeLevelRaw;
  }

  return {
    ok: true,
    value: {
      name,
      parentEmail: parentEmail.value,
      studentEmail: studentEmail.value,
      gradeLevel,
    },
  };
}

export function studentMatchesQuery(
  student: {
    name: string;
    parentEmail: string | null;
    studentEmail: string | null;
    gradeLevel: string | null;
  },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    student.name,
    student.parentEmail ?? "",
    student.studentEmail ?? "",
    student.gradeLevel ?? "",
  ]
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

export type NewStudentDraft = {
  name: string;
  parentEmail: string;
  studentEmail: string;
  gradeLevel: string;
};

export function emptyStudentDraft(gradeLevel = ""): NewStudentDraft {
  return { name: "", parentEmail: "", studentEmail: "", gradeLevel };
}

/** One name per line; blank lines ignored. */
export function parseStudentNamesPaste(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateStudentBatch(
  drafts: NewStudentDraft[],
  gradeLabels: string[],
):
  | { ok: true; values: ValidatedStudentProfile[] }
  | { ok: false; error: string } {
  const values: ValidatedStudentProfile[] = [];
  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    const blank =
      !draft.name.trim() &&
      !draft.parentEmail.trim() &&
      !draft.studentEmail.trim() &&
      !draft.gradeLevel.trim();
    if (blank) continue;
    const parsed = validateStudentProfile({
      name: draft.name,
      parentEmail: draft.parentEmail,
      studentEmail: draft.studentEmail,
      gradeLevel: draft.gradeLevel,
      gradeLabels,
    });
    if (!parsed.ok) {
      return { ok: false, error: `Student ${index + 1}: ${parsed.error}` };
    }
    values.push(parsed.value);
  }
  if (values.length === 0) {
    return { ok: false, error: "Add at least one student name." };
  }
  return { ok: true, values };
}

export function withInviteNote(
  base: string,
  invites: { withEmail: number; sent: number; failed: number },
): string {
  if (invites.withEmail === 0) return base;
  if (invites.failed === 0) {
    return `${base} ${invites.sent === 1 ? "Invite sent." : "Invites sent."}`;
  }
  if (invites.sent === 0) {
    return `${base} ${
      invites.withEmail === 1
        ? "The invite email didn’t send."
        : "The invite emails didn’t send."
    }`;
  }
  return `${base} ${invites.sent} ${invites.sent === 1 ? "invite" : "invites"} sent. ${invites.failed} didn’t send.`;
}

export function toggleIdInSet(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export function mergeSelectedIds(
  current: number[],
  addIds: number[],
): number[] {
  const next = new Set(current);
  for (const id of addIds) next.add(id);
  return [...next];
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

