import type { TourKey } from "./keys";

const PREFIX = "cw-product-tour-step:";

export function tourSessionKey(userId: string, tourKey: TourKey): string {
  return `${PREFIX}${userId}:${tourKey}`;
}

export function readTourStep(userId: string, tourKey: TourKey): number | null {
  try {
    const raw = sessionStorage.getItem(tourSessionKey(userId, tourKey));
    if (raw == null || raw === "") return null;
    const index = Number(raw);
    return Number.isInteger(index) && index >= 0 ? index : null;
  } catch {
    return null;
  }
}

export function writeTourStep(userId: string, tourKey: TourKey, stepIndex: number): void {
  try {
    sessionStorage.setItem(tourSessionKey(userId, tourKey), String(stepIndex));
  } catch {
    /* private mode / quota */
  }
}

export function clearTourStep(userId: string, tourKey: TourKey): void {
  try {
    sessionStorage.removeItem(tourSessionKey(userId, tourKey));
  } catch {
    /* ignore */
  }
}

const LATER_PREFIX = "cw-product-tour-later:";

/** Session-only hide. Not a product_tour_progress row. Not cleared on finish or skip. */
export function tourLaterKey(userId: string, tourKey: TourKey): string {
  return `${LATER_PREFIX}${userId}:${tourKey}`;
}

export function readTourLater(userId: string, tourKey: TourKey): boolean {
  try {
    return sessionStorage.getItem(tourLaterKey(userId, tourKey)) === "1";
  } catch {
    return false;
  }
}

export function writeTourLater(userId: string, tourKey: TourKey): void {
  try {
    sessionStorage.setItem(tourLaterKey(userId, tourKey), "1");
  } catch {
    /* private mode / quota */
  }
}
