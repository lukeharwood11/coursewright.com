/** Optional product surfaces an owner can turn on or off for the org. */
export const ORG_FEATURE_KEYS = [
  "discussions",
  "announcements",
  "resources",
  "lessonPlans",
  "events",
  "calendar",
] as const;

export type OrgFeatureKey = (typeof ORG_FEATURE_KEYS)[number];

export type OrgFeatures = Record<OrgFeatureKey, boolean>;

export const DEFAULT_ORG_FEATURES: OrgFeatures = {
  discussions: true,
  announcements: true,
  resources: true,
  lessonPlans: true,
  events: true,
  calendar: true,
};

export type OrgFeatureOption = {
  key: OrgFeatureKey;
  label: string;
  description: string;
};

/** Settings list order and copy for the Customizations panel. */
export const ORG_FEATURE_OPTIONS: OrgFeatureOption[] = [
  {
    key: "discussions",
    label: "Discussions",
    description: "Two-way threads for a course or class.",
  },
  {
    key: "announcements",
    label: "Announcements",
    description: "One-way notices to courses, classes, or students.",
  },
  {
    key: "resources",
    label: "Resources",
    description: "Organization folders, documents, links, and files.",
  },
  {
    key: "lessonPlans",
    label: "Lesson plans",
    description: "Weekly course plans on the course page and calendar.",
  },
  {
    key: "events",
    label: "Events",
    description: "Calendar items for a course, class, or the whole organization.",
  },
  {
    key: "calendar",
    label: "Calendar view",
    description: "Month, week, and day calendar in the sidebar.",
  },
];

export function parseOrgFeatures(value: unknown): OrgFeatures {
  if (!value || typeof value !== "object") return { ...DEFAULT_ORG_FEATURES };
  const row = value as Record<string, unknown>;
  return {
    discussions: boolOrDefault(row.discussions_enabled ?? row.discussions),
    announcements: boolOrDefault(row.announcements_enabled ?? row.announcements),
    resources: boolOrDefault(row.resources_enabled ?? row.resources),
    lessonPlans: boolOrDefault(row.lesson_plans_enabled ?? row.lessonPlans),
    events: boolOrDefault(row.events_enabled ?? row.events),
    calendar: boolOrDefault(row.calendar_enabled ?? row.calendar),
  };
}

export function sameOrgFeatures(a: OrgFeatures, b: OrgFeatures): boolean {
  return ORG_FEATURE_KEYS.every((key) => a[key] === b[key]);
}

export function toggleOrgFeature(
  features: OrgFeatures,
  key: OrgFeatureKey,
): OrgFeatures {
  return { ...features, [key]: !features[key] };
}

function boolOrDefault(value: unknown): boolean {
  return typeof value === "boolean" ? value : true;
}
