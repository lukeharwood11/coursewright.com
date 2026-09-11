export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (startDate && endDate) {
    return `${formatIsoDate(startDate)} – ${formatIsoDate(endDate)}`;
  }
  if (startDate) return `From ${formatIsoDate(startDate)}`;
  if (endDate) return `Until ${formatIsoDate(endDate)}`;
  return null;
}
