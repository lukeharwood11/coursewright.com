export type FamilyDisplayInput = {
  displayName: string;
};

export type ValidatedFamily = {
  displayName: string | null;
};

export function validateFamily(
  input: FamilyDisplayInput,
): { ok: true; value: ValidatedFamily } | { ok: false; error: string } {
  const displayName = input.displayName.trim();
  return { ok: true, value: { displayName: displayName || null } };
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

export function familyMemberNames(
  students: Array<{ name: string }>,
  parents: Array<{ name: string }>,
): string[] {
  return [
    ...students.map((student) => student.name),
    ...parents.map((parent) => parent.name),
  ];
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

export function peopleNotInFamily<T extends { userId: string }>(
  people: T[],
  linkedUserIds: Iterable<string>,
): T[] {
  const taken = new Set(linkedUserIds);
  return people.filter((person) => !taken.has(person.userId));
}

export function familyWriteErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505") {
    if (error.message.includes("family_members_student_uidx")) {
      return "That student is already in a family.";
    }
    if (error.message.includes("family_members_family_parent_uidx")) {
      return "That parent is already in this family.";
    }
    return "That person is already in this family.";
  }
  if (
    error.code === "42501" ||
    error.message.toLowerCase().includes("row-level security")
  ) {
    return "You don’t have permission to change this family.";
  }
  return error.message;
}
