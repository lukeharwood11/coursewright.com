export function familyLabel(displayName: string | null): string {
  const trimmed = displayName?.trim();
  return trimmed ? trimmed : "Family";
}
