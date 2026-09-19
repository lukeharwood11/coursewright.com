import { isStaffRole, type OrgRole } from "@/organizations/model/role";

export const STAFF_VIEW_MODES = ["teacher", "parent"] as const;
export type StaffViewMode = (typeof STAFF_VIEW_MODES)[number];

export const TEACHER_VIEW_LABEL = "Teacher";
export const PARENT_VIEW_LABEL = "Parent view";

export function parseStaffViewMode(value: string | null | undefined): StaffViewMode {
  return value === "parent" ? "parent" : "teacher";
}

/** Parent-only members always see parent chrome. Staff follow the header toggle. */
export function staffShowsParentPresentation(
  role: OrgRole | null,
  viewMode: StaffViewMode,
): boolean {
  if (!role) return false;
  if (!isStaffRole(role)) return true;
  return viewMode === "parent";
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
