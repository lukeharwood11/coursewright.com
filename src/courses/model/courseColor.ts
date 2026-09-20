export const COURSE_COLOR_KEYS = [
  "moss",
  "slate",
  "clay",
  "plum",
  "sea",
  "wine",
  "sand",
  "pine",
] as const;

export type CourseColorKey = (typeof COURSE_COLOR_KEYS)[number];

const LABELS: Record<CourseColorKey, string> = {
  moss: "Moss",
  slate: "Slate",
  clay: "Clay",
  plum: "Plum",
  sea: "Sea",
  wine: "Wine",
  sand: "Sand",
  pine: "Pine",
};

export function parseCourseColorKey(value: string | null | undefined): CourseColorKey {
  if (value && (COURSE_COLOR_KEYS as readonly string[]).includes(value)) {
    return value as CourseColorKey;
  }
  return "moss";
}

export function courseColorLabel(key: CourseColorKey): string {
  return LABELS[key];
}

export function courseColorCssVar(key: CourseColorKey): string {
  return `var(--course-${key})`;
}

/** Stable palette pick from a numeric seed (course id or existing count). */
export function autoCourseColorKey(seed: number): CourseColorKey {
  const index = Math.abs(Math.trunc(seed)) % COURSE_COLOR_KEYS.length;
  return COURSE_COLOR_KEYS[index] ?? "moss";
}
