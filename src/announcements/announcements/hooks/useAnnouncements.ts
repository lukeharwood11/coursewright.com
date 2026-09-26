import { useQuery } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffBrowsesContent, staffCanEdit } from "@/app/layouts/model/viewMode";
import { browsesAsStaff } from "@/organizations/model/role";
import {
  announcementQueryKeys,
  listAnnouncementsForOrganization,
} from "@/announcements/databridge/announcements";
import {
  loadDashboardForStaffViewMode,
  loadParentDashboard,
  parentQueryKeys,
} from "@/parent/databridge/dashboard";
import { localIsoDate } from "@/parent/model/thisWeek";

export function useAnnouncements() {
  const { organization, role, parentPresentation, staffViewMode } = useOrgShell();
  const user = useAuthedUser();
  const canEdit = staffCanEdit(role, parentPresentation);
  const browses = staffBrowsesContent(role, parentPresentation);
  const staff = role ? browsesAsStaff(role) : false;
  const today = localIsoDate();
  const scope =
    staff && parentPresentation
      ? staffViewMode === "parent" || staffViewMode === "student"
        ? staffViewMode
        : ("preview" as const)
      : ("family" as const);

  const staffListQuery = useQuery({
    queryKey: announcementQueryKeys.org(organization.id),
    queryFn: () => listAnnouncementsForOrganization(organization.id),
    enabled: browses,
  });

  const parentDashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(organization.id, user.id, scope),
    queryFn: () => {
      if (staff && parentPresentation) {
        return loadDashboardForStaffViewMode(
          organization.id,
          user.id,
          staffViewMode === "teacher" ? "preview" : staffViewMode,
        );
      }
      return loadParentDashboard(organization.id, user.id);
    },
    enabled: parentPresentation,
  });

  if (parentPresentation) {
    return {
      organization,
      canEdit: false as const,
      isParent: true as const,
      today,
      announcements: staffListQuery.data ?? [],
      parentAnnouncements: parentDashboardQuery.data?.announcements ?? [],
      showStudent:
        (parentDashboardQuery.data?.students.length ?? 0) > 1,
      loading: parentDashboardQuery.isLoading,
      error: parentDashboardQuery.error
        ? parentDashboardQuery.error.message
        : null,
    };
  }

  return {
    organization,
    canEdit,
    isParent: false as const,
    today,
    announcements: staffListQuery.data ?? [],
    parentAnnouncements: [],
    showStudent: false,
    loading: staffListQuery.isLoading,
    error: staffListQuery.error ? staffListQuery.error.message : null,
  };
}
