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
