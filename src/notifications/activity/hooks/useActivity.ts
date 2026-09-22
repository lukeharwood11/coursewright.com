import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  listNotifications,
  markNotificationRead,
  notificationQueryKeys,
} from "@/notifications/databridge/notifications";
import {
  sortActivityForList,
  type ActivityItem,
} from "@/notifications/model/activity";
import { activityItemPath } from "@/notifications/model/paths";

export function useActivity() {
  const { organization } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: notificationQueryKeys.org(organization.id, user.id),
    queryFn: () => listNotifications(organization.id),
  });

  const ack = useMutation({
    mutationFn: async (item: ActivityItem) => {
      if (item.readAt == null) {
        await markNotificationRead(item.id);
      }
      return item;
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.org(organization.id, user.id),
      });
      const href = activityItemPath(organization.slug, item);
      if (href) navigate(href);
    },
  });

  return {
    organization,
    items: sortActivityForList(listQuery.data ?? []),
    loading: listQuery.isLoading,
    error: listQuery.error ? listQuery.error.message : null,
    openingId: ack.isPending ? (ack.variables?.id ?? null) : null,
    onOpen: (item: ActivityItem) => ack.mutate(item),
  };
}
