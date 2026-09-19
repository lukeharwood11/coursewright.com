export function addIsoDays(isoDate: string, amount: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + amount);
  return toIso(date);
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIso(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function monthContaining(isoDate: string): {
  start: string;
  end: string;
  label: string;
  gridStart: string;
  gridEnd: string;
} {
  const date = parseIso(isoDate);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  const gridEnd = new Date(end);
  gridEnd.setDate(end.getDate() + (6 - end.getDay()));
  return {
    start: toIso(start),
    end: toIso(end),
    label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    gridStart: toIso(gridStart),
    gridEnd: toIso(gridEnd),
  };
}

export function shiftMonth(isoDate: string, delta: number): string {
  const date = parseIso(isoDate);
  date.setMonth(date.getMonth() + delta, 1);
  return toIso(date);
}

export function datesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addIsoDays(cursor, 1);
  }
  return dates;
}

export function weekdayShort(isoDate: string): string {
  return parseIso(isoDate).toLocaleDateString("en-US", { weekday: "short" });
}

export function dayNumber(isoDate: string): string {
  return String(parseIso(isoDate).getDate());
}
