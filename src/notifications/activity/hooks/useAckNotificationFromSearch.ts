import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  markNotificationRead,
  notificationQueryKeys,
} from "@/notifications/databridge/notifications";

/** Ack the Activity row a push notification opened, including @mentions. */
export function useAckNotificationFromSearch() {
  const [params] = useSearchParams();
  const raw = params.get("activity");
  const activityId = raw ? Number(raw) : NaN;
  const user = useAuthedUser();
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!Number.isInteger(activityId) || activityId <= 0) return;
    let cancelled = false;
    void markNotificationRead(activityId)
      .then(() => {
        if (cancelled) return;
        void queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.org(organization.id, user.id),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activityId, organization.id, user.id, queryClient]);
}
