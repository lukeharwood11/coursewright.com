import {
  browsesAsStaff,
  isStaffRole,
  type OrgRole,
} from "@/organizations/model/role";

export const STAFF_VIEW_MODES = ["teacher", "preview", "parent", "student"] as const;
export type StaffViewMode = (typeof STAFF_VIEW_MODES)[number];

export const TEACHER_VIEW_LABEL = "Teacher";
export const PREVIEW_VIEW_LABEL = "Preview";
export const PARENT_VIEW_LABEL = "Parent";
export const STUDENT_VIEW_LABEL = "Student";

const MODE_SET = new Set<string>(STAFF_VIEW_MODES);

export type StaffViewModeOption = {
  mode: StaffViewMode;
  label: string;
};

export function staffViewModeLabel(mode: StaffViewMode): string {
  switch (mode) {
    case "teacher":
      return TEACHER_VIEW_LABEL;
    case "preview":
      return PREVIEW_VIEW_LABEL;
    case "parent":
      return PARENT_VIEW_LABEL;
    case "student":
      return STUDENT_VIEW_LABEL;
  }
}

/** Modes a writer may pick, given additive parent/student flags. */
export function availableStaffViewModes(input: {
  isParent: boolean;
  isStudent: boolean;
}): StaffViewModeOption[] {
  const modes: StaffViewMode[] = ["teacher", "preview"];
  if (input.isParent) modes.push("parent");
  if (input.isStudent) modes.push("student");
  return modes.map((mode) => ({ mode, label: staffViewModeLabel(mode) }));
}

/**
 * Parse a stored value. Legacy `"parent"` (old Student view) is returned as
 * `"parent"` here; callers should run {@link resolveStaffViewMode} with flags.
 */
export function parseStaffViewMode(value: string | null | undefined): StaffViewMode {
  if (value && MODE_SET.has(value)) return value as StaffViewMode;
  return "teacher";
}

/**
 * Map a raw/legacy stored mode onto one that is currently allowed.
 * Legacy `"parent"` without family flags becomes `"preview"`.
 */
export function resolveStaffViewMode(
  value: string | null | undefined,
  flags: { isParent: boolean; isStudent: boolean },
): StaffViewMode {
  const parsed = parseStaffViewMode(value);
  const allowed = new Set(
    availableStaffViewModes(flags).map((option) => option.mode),
  );
  if (allowed.has(parsed)) return parsed;
  // Legacy Student view stored as "parent" — prefer real family tabs, else Preview.
  if (value === "parent") {
    if (flags.isParent) return "parent";
    if (flags.isStudent) return "student";
    return "preview";
  }
  return "teacher";
}

/**
 * Parent and student always see student chrome.
 * Observer always sees staff chrome. The header toggle does not apply.
 * Writers follow the header toggle (any non-teacher mode).
 */
export function staffShowsParentPresentation(
  role: OrgRole | null,
  viewMode: StaffViewMode,
): boolean {
  if (!role) return false;
  if (role === "observer") return false;
  if (!isStaffRole(role)) return true;
  return viewMode !== "teacher";
}

export function canUseStaffViewToggle(role: OrgRole | null): boolean {
  return Boolean(role && isStaffRole(role));
}

export function staffCanEdit(
  role: OrgRole | null,
  parentPresentation: boolean,
): boolean {
  return Boolean(role && isStaffRole(role) && !parentPresentation);
}

/** Staff header **Preview** — student chrome without a linked family account. */
export function isStaffInstructorPreview(
  role: OrgRole | null,
  staffViewMode: StaffViewMode,
): boolean {
  return Boolean(role && isStaffRole(role) && staffViewMode === "preview");
}

export const STAFF_PREVIEW_DISCUSSION_HINT =
  "Switch to Teacher view to start or post in a discussion.";

/** Drafts, unpublished rows, and answer keys. Does not grant a write. */
export function staffBrowsesContent(
  role: OrgRole | null,
  parentPresentation: boolean,
): boolean {
  return Boolean(role && browsesAsStaff(role) && !parentPresentation);
}

export function familyVisibleCourses<
  T extends { status: string; visibility: string },
>(courses: T[]): T[] {
  return courses.filter(
    (course) => course.status === "active" && course.visibility === "published",
  );
}

export function familyVisibleMaterials<T extends { visibility: string }>(
  materials: T[],
): T[] {
  return materials.filter((material) => material.visibility === "published");
}

export function courseVisibleToFamilies(course: {
  status: string;
  visibility: string;
}): boolean {
  return course.status === "active" && course.visibility === "published";
}
