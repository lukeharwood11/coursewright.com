import { useQuery } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  announcementQueryKeys,
  listAnnouncementsForOrganization,
} from "@/announcements/databridge/announcements";
import { localIsoDate } from "@/parent/model/thisWeek";

export function useAnnouncements() {
  const { organization, role, parentPresentation } = useOrgShell();
  const canEdit = staffCanEdit(role, parentPresentation);
  const today = localIsoDate();

  const listQuery = useQuery({
    queryKey: announcementQueryKeys.org(organization.id),
    queryFn: () => listAnnouncementsForOrganization(organization.id),
    enabled: canEdit,
  });

  return {
    organization,
    canEdit,
    today,
    announcements: listQuery.data ?? [],
    loading: listQuery.isLoading,
    error: listQuery.error ? listQuery.error.message : null,
  };
}
