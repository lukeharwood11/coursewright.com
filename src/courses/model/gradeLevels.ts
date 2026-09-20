/** Keep selected grades that exist on the org, in the org’s label order. */
export function allowedGradeLevels(
  selected: string[],
  orgLabels: string[],
): string[] {
  const allowed = new Set(orgLabels);
  return orderedGradeLevels(
    selected.filter((label) => allowed.has(label)),
    orgLabels,
  );
}

/**
 * Display order for course grade pills: org scheme order, then any leftover
 * labels (legacy values) in the order they were stored.
 */
export function orderedGradeLevels(
  selected: string[],
  orgLabels: string[],
): string[] {
  const remaining = new Set(selected);
  const ordered: string[] = [];

  for (const label of orgLabels) {
    if (!remaining.has(label)) continue;
    ordered.push(label);
    remaining.delete(label);
  }

  for (const label of selected) {
    if (!remaining.has(label)) continue;
    ordered.push(label);
    remaining.delete(label);
  }

  return ordered;
}

export function formatGradeLevels(
  selected: string[],
  orgLabels: string[],
): string {
  return orderedGradeLevels(selected, orgLabels).join(", ");
}

export function toggleGradeLevel(selected: string[], label: string): string[] {
  if (selected.includes(label)) {
    return selected.filter((item) => item !== label);
  }
  return [...selected, label];
}
