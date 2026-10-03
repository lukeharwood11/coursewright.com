import {
  browsesAsStaff,
  isStaffRole,
  roleLabel,
  type OrgRole,
} from "@/organizations/model/role";

export const STAFF_VIEW_MODES = ["teacher", "preview", "parent", "student"] as const;
export type StaffViewMode = (typeof STAFF_VIEW_MODES)[number];

/** @deprecated Prefer {@link staffViewModeLabel} with a writer role. */
export const TEACHER_VIEW_LABEL = "Instructor";
export const PREVIEW_VIEW_LABEL = "Preview";
export const PARENT_VIEW_LABEL = "Parent";
export const STUDENT_VIEW_LABEL = "Student";

const MODE_SET = new Set<string>(STAFF_VIEW_MODES);

export type StaffViewModeOption = {
  mode: StaffViewMode;
  label: string;
};

export function staffViewModeLabel(
  mode: StaffViewMode,
  staffRole?: OrgRole | null,
): string {
  switch (mode) {
    case "teacher":
      if (staffRole && isStaffRole(staffRole)) return roleLabel(staffRole);
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
  staffRole?: OrgRole | null;
}): StaffViewModeOption[] {
  const modes: StaffViewMode[] = ["teacher", "preview"];
  if (input.isParent) modes.push("parent");
  if (input.isStudent) modes.push("student");
  return modes.map((mode) => ({
    mode,
    label: staffViewModeLabel(mode, input.staffRole),
  }));
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
  role?: OrgRole | null,
): StaffViewMode {
  if (role === "observer") return "teacher";
  const parsed = parseStaffViewMode(value);
  const allowed = new Set(
    availableStaffViewModes({ ...flags, staffRole: role }).map(
      (option) => option.mode,
    ),
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

/** Writers only — observers stay in staff chrome with no preview toggle. */
export function canUseStaffViewToggle(role: OrgRole | null): boolean {
  return Boolean(role && isStaffRole(role));
}

export function staffWriterInPreviewMode(
  role: OrgRole | null,
  staffViewMode: StaffViewMode,
): boolean {
  return Boolean(role && isStaffRole(role) && staffViewMode === "preview");
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
  return staffWriterInPreviewMode(role, staffViewMode);
}

export function staffPreviewActionHint(
  role: OrgRole | null,
  action: string,
): string {
  const view = staffViewModeLabel("teacher", role);
  return `Switch to ${view} view to ${action}.`;
}

export function staffPreviewDiscussionHint(role: OrgRole | null): string {
  return staffPreviewActionHint(role, "start or post in a discussion");
}

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
