import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import {
  claimStaffInvite,
  getStaffInvite,
  staffInviteQueryKeys,
} from "@/organizations/databridge/staffInvites";

export function useClaimInvite(token: string | undefined) {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trimmed = token?.trim() ?? "";

  const inviteQuery = useQuery({
    queryKey: staffInviteQueryKeys.byToken(trimmed),
    queryFn: () => getStaffInvite(trimmed),
    enabled: Boolean(trimmed),
  });

  const claimMutation = useMutation({
    mutationFn: () => claimStaffInvite(trimmed),
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

  const invite = inviteQuery.data ?? null;
  const alreadyAccepted = Boolean(invite?.acceptedAt);
  const canAccept = Boolean(invite && invite.emailMatches && !alreadyAccepted);

  return {
    loading: inviteQuery.isLoading,
    loadError: inviteQuery.error ? inviteQuery.error.message : null,
    invite,
    notFound: !inviteQuery.isLoading && !inviteQuery.error && !invite,
    alreadyAccepted,
    canAccept,
    claiming: claimMutation.isPending,
    claimError: claimMutation.error ? claimMutation.error.message : null,
    onAccept: () => claimMutation.mutate(),
    onOpenOrg: () => {
      if (invite) navigate(`/my/${invite.organizationSlug}`);
    },
  };
}
