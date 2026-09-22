import { addIsoDays } from "@/calendar/model/dates";

export function eventEndDate(startsOn: string, endsOn: string | null): string {
  return endsOn && endsOn >= startsOn ? endsOn : startsOn;
}

export function eventOverlapsRange(
  startsOn: string,
  endsOn: string | null,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const end = eventEndDate(startsOn, endsOn);
  return startsOn <= rangeEnd && end >= rangeStart;
}

export function datesForEvent(
  startsOn: string,
  endsOn: string | null,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const end = eventEndDate(startsOn, endsOn);
  const first = startsOn > rangeStart ? startsOn : rangeStart;
  const last = end < rangeEnd ? end : rangeEnd;
  if (first > last) return [];
  const dates: string[] = [];
  let cursor = first;
  while (cursor <= last) {
    dates.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return dates;
}

export function formatClock(time: string | null): string | null {
  if (!time) return null;
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatEventTime(
  startTime: string | null,
  endTime: string | null,
): string | null {
  const start = formatClock(startTime);
  const end = formatClock(endTime);
  if (start && end) return `${start} – ${end}`;
  return start;
}

function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventDates(startsOn: string, endsOn: string | null): string {
  const end = eventEndDate(startsOn, endsOn);
  if (end === startsOn) return formatIsoDate(startsOn);
  return `${formatIsoDate(startsOn)} – ${formatIsoDate(end)}`;
}

export function formatEventWhen(args: {
  startsOn: string;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
}): string {
  const dates = formatEventDates(args.startsOn, args.endsOn);
  const time = formatEventTime(args.startTime, args.endTime);
  return time ? `${dates} · ${time}` : dates;
}

/** `HH:MM` from an `<input type="time">` or a Postgres `time` value. */
export function normalizeTimeInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2}):(\d{2})/.exec(trimmed);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}
