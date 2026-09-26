import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  announcementQueryKeys,
  getAnnouncement,
  markAnnouncementRead,
  softDeleteAnnouncement,
} from "@/announcements/databridge/announcements";
import { useAckNotificationFromSearch } from "@/notifications/activity/hooks/useAckNotificationFromSearch";
import {
  markAnnouncementNotificationsRead,
  notificationQueryKeys,
} from "@/notifications/databridge/notifications";
import { isAnnouncementAvailable } from "@/announcements/model/availability";
import { parentQueryKeys } from "@/parent/databridge/dashboard";
import { localIsoDate } from "@/parent/model/thisWeek";

export function useAnnouncement() {
  const params = useParams();
  const announcementId = params.announcementId ? Number(params.announcementId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  useAckNotificationFromSearch();
  const canEdit = staffCanEdit(role, parentPresentation);
  const today = localIsoDate();

  const announcementQuery = useQuery({
    queryKey: announcementQueryKeys.detail(announcementId),
    queryFn: () => getAnnouncement(announcementId, user.id),
    enabled: Number.isFinite(announcementId),
  });

  const announcement = announcementQuery.data ?? null;
  const belongsHere =
    announcement != null &&
    announcement.organizationId === organization.id &&
    announcement.deletedAt == null;
  const familyHidden =
    parentPresentation &&
    announcement != null &&
    (!isAnnouncementAvailable(today, announcement.startDate, announcement.endDate) ||
      announcement.deletedAt != null);

  useEffect(() => {
    if (!belongsHere || familyHidden || !announcement) return;
    void markAnnouncementNotificationsRead(announcement.id).then(() => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.org(organization.id, user.id),
      });
    });
  }, [belongsHere, familyHidden, announcement, organization.id, user.id, queryClient]);

  useEffect(() => {
    if (!parentPresentation || !belongsHere || familyHidden || !announcement) return;
    if (announcement.read) return;
    void markAnnouncementRead(announcement.id, user.id).then(() => {
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.detail(announcement.id),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.org(organization.id),
      });
      void queryClient.invalidateQueries({
        queryKey: parentQueryKeys.dashboardPrefix(organization.id, user.id),
      });
    });
  }, [
    parentPresentation,
    belongsHere,
    familyHidden,
    announcement,
    user.id,
    organization.id,
    queryClient,
  ]);

  const remove = useMutation({
    mutationFn: () => softDeleteAnnouncement(announcementId, user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.org(organization.id),
      });
      void queryClient.invalidateQueries({
        queryKey: parentQueryKeys.dashboardPrefix(organization.id, user.id),
      });
    },
  });

  return {
    organization,
    announcementId,
    canEdit,
    isParent: parentPresentation,
    today,
    announcement: belongsHere && !familyHidden ? announcement : null,
    loading: announcementQuery.isLoading,
    error: announcementQuery.error
      ? announcementQuery.error.message
      : remove.error?.message ?? null,
    notFound:
      !announcementQuery.isLoading &&
      (!belongsHere || familyHidden || !announcement || announcement.deletedAt != null),
    unavailable: Boolean(familyHidden && belongsHere && announcement && !announcement.deletedAt),
    remove,
  };
}
