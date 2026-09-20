export type AnnouncementAvailability = "upcoming" | "available" | "ended";

/** Current on home: after start (if set) and through end (if set). No dates = available. */
export function announcementAvailability(
  today: string,
  startDate: string | null,
  endDate: string | null,
): AnnouncementAvailability {
  if (startDate && today < startDate) return "upcoming";
  if (endDate && today > endDate) return "ended";
  return "available";
}

export function isAnnouncementAvailable(
  today: string,
  startDate: string | null,
  endDate: string | null,
): boolean {
  return announcementAvailability(today, startDate, endDate) === "available";
}

export function announcementAvailabilityLabel(
  status: AnnouncementAvailability,
): string {
  if (status === "upcoming") return "Upcoming";
  if (status === "ended") return "Ended";
  return "Available now";
}

export function groupAnnouncementsByAvailability<
  T extends { startDate: string | null; endDate: string | null },
>(
  items: T[],
  today: string,
): Record<AnnouncementAvailability, T[]> {
  const groups: Record<AnnouncementAvailability, T[]> = {
    available: [],
    upcoming: [],
    ended: [],
  };
  for (const item of items) {
    groups[announcementAvailability(today, item.startDate, item.endDate)].push(item);
  }
  return groups;
}
