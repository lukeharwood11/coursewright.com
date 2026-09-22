export const EVENT_AUDIENCES = ["course", "class", "organization"] as const;
export type EventAudience = (typeof EVENT_AUDIENCES)[number];

export function parseEventAudience(
  value: string | null | undefined,
): EventAudience | null {
  if (value === "course" || value === "class" || value === "organization") return value;
  return null;
}

export function eventAudienceLabel(audience: EventAudience): string {
  if (audience === "course") return "Course";
  if (audience === "class") return "Class";
  return "Organization";
}

/** Parent view keeps an event when a linked student is in any target course or class. */
export function eventAppliesToFamily(
  event: { audience: EventAudience; courseIds: number[]; classIds: number[] },
  courseIds: ReadonlySet<number>,
  classIds: ReadonlySet<number>,
): boolean {
  if (event.audience === "organization") return true;
  if (event.audience === "course") {
    return event.courseIds.some((id) => courseIds.has(id));
  }
  return event.classIds.some((id) => classIds.has(id));
}

export function eventTargetSummary(names: string[], fallback = "Audience"): string {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return fallback;
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  const remaining = cleaned.length - 2;
  const others = remaining === 1 ? "1 other" : `${remaining} others`;
  return `${cleaned[0]}, ${cleaned[1]} and ${others}`;
}
