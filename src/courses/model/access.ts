import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { canManageOrgSettings, type OrgRole } from "@/organizations/model/role";

/** Staff may edit a course they teach; owners/admins may edit any course. */
export function staffCanManageCourse(args: {
  role: OrgRole | null;
  parentPresentation: boolean;
  userId: string;
  instructorUserIds: readonly string[];
}): boolean {
  if (!staffCanEdit(args.role, args.parentPresentation)) return false;
  if (args.role && canManageOrgSettings(args.role)) return true;
  return args.instructorUserIds.includes(args.userId);
}

/** Writers who can manage the course, plus observers (org-wide read). */
export function staffCanViewCourse(args: {
  role: OrgRole | null;
  parentPresentation: boolean;
  userId: string;
  instructorUserIds: readonly string[];
}): boolean {
  if (args.role === "observer") return true;
  return staffCanManageCourse(args);
}
