import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import {
  claimInvite,
  listMyPendingInvites,
  staffInviteQueryKeys,
  type PendingOrgInvite,
} from "@/organizations/databridge/staffInvites";

export function usePendingStaffInvites() {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invitesQuery = useQuery({
    queryKey: staffInviteQueryKeys.mine(user.id),
    queryFn: () => listMyPendingInvites(user.email ?? ""),
  });

  const acceptMutation = useMutation({
    mutationFn: (invite: PendingOrgInvite) => claimInvite(invite.token),
    onSuccess: async (slug) => {
      await queryClient.invalidateQueries({
        queryKey: orgQueryKeys.memberships(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.mine(user.id),
      });
      navigate(`/my/${slug}`);
    },
  });

  return {
    invites: invitesQuery.data ?? [],
    loading: invitesQuery.isLoading,
    loadError: invitesQuery.error ? invitesQuery.error.message : null,
    acceptingId: acceptMutation.isPending
      ? (acceptMutation.variables?.id ?? null)
      : null,
    acceptError: acceptMutation.error ? acceptMutation.error.message : null,
    onAccept: (invite: PendingOrgInvite) => acceptMutation.mutate(invite),
  };
}
