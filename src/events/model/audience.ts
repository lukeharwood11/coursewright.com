export const EVENT_AUDIENCES = ["course", "class"] as const;
export type EventAudience = (typeof EVENT_AUDIENCES)[number];

export function parseEventAudience(
  value: string | null | undefined,
): EventAudience | null {
  if (value === "course" || value === "class") return value;
  return null;
}

export function eventAudienceLabel(audience: EventAudience): string {
  return audience === "course" ? "Course" : "Class";
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
