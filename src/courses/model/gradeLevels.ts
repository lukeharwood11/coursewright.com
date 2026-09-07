export function allowedGradeLevels(
  selected: string[],
  orgLabels: string[],
): string[] {
  const allowed = new Set(orgLabels);
  return selected.filter((label) => allowed.has(label));
}

export function toggleGradeLevel(selected: string[], label: string): string[] {
  if (selected.includes(label)) {
    return selected.filter((item) => item !== label);
  }
  return [...selected, label];
}
