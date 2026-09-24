import { useQuery } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffBrowsesContent, staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  announcementQueryKeys,
  listAnnouncementsForOrganization,
} from "@/announcements/databridge/announcements";
import { loadParentDashboard, parentQueryKeys } from "@/parent/databridge/dashboard";
import { localIsoDate } from "@/parent/model/thisWeek";

export function useAnnouncements() {
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const canEdit = staffCanEdit(role, parentPresentation);
  const browses = staffBrowsesContent(role, parentPresentation);
  const today = localIsoDate();

  const staffListQuery = useQuery({
    queryKey: announcementQueryKeys.org(organization.id),
    queryFn: () => listAnnouncementsForOrganization(organization.id),
    enabled: browses,
  });

  const parentDashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(organization.id, user.id),
    queryFn: () => loadParentDashboard(organization.id, user.id),
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
