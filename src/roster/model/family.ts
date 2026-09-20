export type FamilyDisplayInput = {
  displayName: string;
};

export type ValidatedFamily = {
  displayName: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFamily(
  input: FamilyDisplayInput,
): { ok: true; value: ValidatedFamily } | { ok: false; error: string } {
  const displayName = input.displayName.trim();
  if (!displayName) {
    return { ok: false, error: "Name is required." };
  }
  return { ok: true, value: { displayName } };
}

export function familyLabel(
  displayName: string | null,
  memberNames: string[] = [],
): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed;

  const names = memberNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return "Family";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

export function familyMemberNames(students: Array<{ name: string }>): string[] {
  return students.map((student) => student.name);
}

export function familyCountSummary(
  studentCount: number,
  parentCount: number,
): string {
  const students =
    studentCount === 1 ? "1 student" : `${studentCount} students`;
  const parents = parentCount === 1 ? "1 parent" : `${parentCount} parents`;
  return `${students} · ${parents}`;
}

export function studentIdsInFamilies<
  T extends { students: Array<{ student: { id: number } }> },
>(families: T[]): Set<number> {
  const taken = new Set<number>();
  for (const family of families) {
    for (const member of family.students) {
      taken.add(member.student.id);
    }
  }
  return taken;
}

export function findPersonByEmail<T extends { email: string }>(
  people: T[],
  email: string,
): T | null {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  return people.find((person) => person.email.toLowerCase() === needle) ?? null;
}

export function parseParentEmail(
  raw: string,
): { ok: true; email: string | null } | { ok: false; error: string } {
  const email = raw.trim().toLowerCase();
  if (!email) return { ok: true, email: null };
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid parent email, or choose an account." };
  }
  return { ok: true, email };
}

export function familyWriteErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") {
    if (error.message.includes("family_members_student_uidx")) {
      return "That student is already in a family.";
    }
    if (error.message.includes("admin_invites_pending_parent_uidx")) {
      return "An invite for that email is already pending.";
    }
    return "That student is already in a family.";
  }
  if (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security")
  ) {
    return "You don’t have permission to change this family.";
  }
  return error.message;
}
