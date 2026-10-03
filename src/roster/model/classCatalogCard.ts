export function classMemberLabel(count: number): string {
  if (count === 0) return "No students";
  if (count === 1) return "1 student";
  return `${count} students`;
}

export function classTeacherRosterLabel(names: string[]): string {
  if (names.length === 0) return "No instructors";
  return names.join(", ");
}
