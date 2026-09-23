export const DEFAULT_DUE_TIME = "23:59";

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function timeZoneLabel(timeZone: string, when = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longGeneric",
    }).formatToParts(when);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  let hour = pick("hour");
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    hour,
    pick("minute"),
    pick("second"),
  );
  return asUtc - instant.getTime();
}

/** Wall-clock date + time in `timeZone`, as a UTC instant. */
export function dueInstantIso(date: string, time: string, timeZone: string): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error("That due date isn’t valid.");
  }
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) throw new Error("That due date isn’t valid.");

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = zoneOffsetMs(new Date(utcGuess), timeZone);
  let utc = utcGuess - offset;
  const corrected = zoneOffsetMs(new Date(utc), timeZone);
  if (corrected !== offset) utc = utcGuess - corrected;
  return new Date(utc).toISOString();
}

export function wallTimeInZone(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  let hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  if (hour === "24") hour = "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function formatDueDeadline(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatSubmittedAt(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTimeRemaining(dueAt: string, now: Date): string | null {
  const dueMs = new Date(dueAt).getTime();
  if (Number.isNaN(dueMs)) return null;
  const ms = dueMs - now.getTime();
  if (ms <= 0) return null;

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 2) return `${days} days left`;
  if (days === 1) {
    if (hours === 0) return "1 day left";
    return hours === 1 ? "1 day 1 hour left" : `1 day ${hours} hours left`;
  }
  if (hours >= 2) {
    if (minutes === 0) return `${hours} hours left`;
    return `${hours} hours ${minutes} minutes left`;
  }
  if (hours === 1) {
    if (minutes === 0) return "1 hour left";
    return minutes === 1 ? "1 hour 1 minute left" : `1 hour ${minutes} minutes left`;
  }
  if (minutes >= 2) return `${minutes} minutes left`;
  if (minutes === 1) return "1 minute left";
  return "Less than a minute left";
}

/** True when late submit is off and a due instant is set (submit closes at due). */
export function submissionClosesAtDue(args: {
  allowPastDue: boolean;
  dueAt: string | null;
}): boolean {
  return !args.allowPastDue && Boolean(args.dueAt);
}
