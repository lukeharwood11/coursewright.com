export type BulletinAvailability = "upcoming" | "available" | "ended";

export function bulletinAvailability(
  today: string,
  startDate: string,
  endDate: string,
): BulletinAvailability {
  if (today < startDate) return "upcoming";
  if (today > endDate) return "ended";
  return "available";
}

export function isBulletinAvailable(
  today: string,
  startDate: string,
  endDate: string,
): boolean {
  return bulletinAvailability(today, startDate, endDate) === "available";
}

export function bulletinAvailabilityLabel(status: BulletinAvailability): string {
  if (status === "upcoming") return "Upcoming";
  if (status === "ended") return "Ended";
  return "Available now";
}
