import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffBrowsesContent, staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  eventQueryKeys,
  getEvent,
  listCourseIdsTaughtBy,
  softDeleteEvent,
} from "@/events/databridge/events";
import { canEditEventAudience } from "@/events/model/validate";
import { canManageOrgSettings } from "@/organizations/model/role";
import { parentQueryKeys } from "@/parent/databridge/dashboard";

export function useEvent() {
  const params = useParams();
  const eventId = Number(params.eventId);
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const staffEditing = staffCanEdit(role, parentPresentation);
  const seesStaffContent = staffBrowsesContent(role, parentPresentation);
  const canPickAnyCourse = role ? canManageOrgSettings(role) : false;
  const [confirmRemove, setConfirmRemove] = useState(false);

  const eventQuery = useQuery({
    queryKey: eventQueryKeys.detail(eventId),
    queryFn: () => getEvent(eventId),
    enabled: Number.isFinite(eventId),
  });
  const taughtQuery = useQuery({
    queryKey: ["courses", "taught", user.id],
    queryFn: () => listCourseIdsTaughtBy(user.id),
    enabled: staffEditing && !canPickAnyCourse && eventQuery.data?.audience === "course",
  });

  const loaded = eventQuery.data ?? null;
  const canEdit =
    staffEditing &&
    loaded != null &&
    canEditEventAudience({
      audience: loaded.audience,
      courseIds: loaded.courseIds,
      canPickAnyCourse,
      taughtCourseIds: taughtQuery.data ?? [],
      isStaff: true,
    });

  const remove = useMutation({
    mutationFn: () => softDeleteEvent(eventId, user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({
        queryKey: parentQueryKeys.dashboardPrefix(organization.id, user.id),
      });
      toast.success("Event removed");
      navigate(`/my/${organization.slug}/calendar`);
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  return {
    organization,
    event: loaded,
    loading: eventQuery.isLoading,
    notFound: eventQuery.isSuccess && !loaded,
    canEdit,
    seesStaffContent,
    confirmRemove,
    setConfirmRemove,
    removing: remove.isPending,
    remove: () => remove.mutate(),
  };
}
