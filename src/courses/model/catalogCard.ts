export function studentEnrollmentLabel(count: number): string {
  if (count === 0) return "No students enrolled";
  if (count === 1) return "1 student enrolled";
  return `${count} students enrolled`;
}

export function instructorRosterLabel(names: string[]): string {
  if (names.length === 0) return "No instructors";
  return names.join(", ");
}
