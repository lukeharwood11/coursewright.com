import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAppShell } from "@/app/layouts/OrgShellContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { discussionMessagePath, discussionPath } from "@/discussions/model/paths";
import {
  listNotifications,
  markNotificationRead,
  notificationQueryKeys,
} from "@/notifications/databridge/notifications";
import {
  activityBellPreview,
  type ActivityItem,
} from "@/notifications/model/activity";
import { activityPath } from "@/notifications/model/paths";

export function useActivityMenu() {
  const { organization } = useAppShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organizationId = organization?.id;

  const listQuery = useQuery({
    queryKey: notificationQueryKeys.org(organizationId ?? 0, user.id),
    queryFn: () => listNotifications(organizationId!),
    enabled: Boolean(organizationId),
  });

  const preview = activityBellPreview(listQuery.data ?? []);

  const ack = useMutation({
    mutationFn: async (item: ActivityItem) => {
      if (item.readAt == null) {
        await markNotificationRead(item.id);
      }
      return item;
    },
    onSuccess: (item) => {
      if (!organization) return;
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.org(organization.id, user.id),
      });
      if (item.discussionId != null) {
        const href =
          item.discussionMessageId != null
            ? discussionMessagePath(
                organization.slug,
                item.discussionId,
                item.discussionMessageId,
              )
            : discussionPath(organization.slug, item.discussionId);
        navigate(href);
      }
    },
  });

  return {
    visible: Boolean(organization),
    activityHref: organization ? activityPath(organization.slug) : "/my",
    preview: preview.preview,
    remainingUnread: preview.remainingUnread,
    unreadCount: preview.unreadCount,
    loading: listQuery.isLoading,
    error: listQuery.error ? listQuery.error.message : null,
    openingId: ack.isPending ? (ack.variables?.id ?? null) : null,
    onOpen: (item: ActivityItem) => ack.mutate(item),
  };
}
