function formatResourceDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** True when a later save moved `updated_at` past create. */
export function resourceWasUpdated(createdAt: string, updatedAt: string): boolean {
  const created = Date.parse(createdAt);
  const updated = Date.parse(updatedAt);
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;
  return updated - created > 1000;
}

export function resourceCreatedLabel(iso: string): string {
  const formatted = formatResourceDate(iso);
  return formatted ? `Created ${formatted}` : "";
}

export function resourceUpdatedLabel(iso: string): string {
  const formatted = formatResourceDate(iso);
  return formatted ? `Updated ${formatted}` : "";
}
