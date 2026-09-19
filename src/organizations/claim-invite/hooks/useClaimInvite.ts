import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { signOut } from "@/auth/api/session";
import { useAuthSession } from "@/auth/hooks/useAuthSession";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import {
  claimInvite,
  getInvite,
  staffInviteQueryKeys,
} from "@/organizations/databridge/staffInvites";
import { inviteLoginHref, inviteSignupHref } from "@/organizations/model/inviteClaim";

export function useClaimInvite(token: string | undefined) {
  const session = useAuthSession();
  const user = session.status === "ready" ? session.user : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trimmed = token?.trim() ?? "";
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const inviteQuery = useQuery({
    queryKey: [...staffInviteQueryKeys.byToken(trimmed), user?.id ?? "anon"],
    queryFn: () => getInvite(trimmed),
    enabled: Boolean(trimmed) && session.status === "ready",
  });

  const claimMutation = useMutation({
    mutationFn: () => claimInvite(trimmed),
    onSuccess: async (slug) => {
      if (user) {
        await queryClient.invalidateQueries({
          queryKey: orgQueryKeys.memberships(user.id),
        });
        await queryClient.invalidateQueries({
          queryKey: staffInviteQueryKeys.mine(user.id),
        });
      }
      navigate(`/my/${slug}`);
    },
  });

  const invite = inviteQuery.data ?? null;
  const alreadyAccepted = Boolean(invite?.acceptedAt);
  const signedIn = Boolean(user);
  const canAccept = Boolean(invite && invite.emailMatches && !alreadyAccepted);

  return {
    loading: session.status === "loading" || inviteQuery.isLoading,
    loadError: inviteQuery.error ? inviteQuery.error.message : null,
    invite,
    notFound: !inviteQuery.isLoading && !inviteQuery.error && !invite,
    alreadyAccepted,
    signedIn,
    signedInEmail: user?.email ?? null,
    needsAccount: Boolean(invite && !signedIn),
    wrongAccount: Boolean(invite && signedIn && !invite.emailMatches),
    signupHref: invite ? inviteSignupHref(trimmed, invite.email) : "/signup",
    loginHref: invite ? inviteLoginHref(trimmed, invite.email) : "/login",
    canAccept,
    claiming: claimMutation.isPending,
    claimError: claimMutation.error ? claimMutation.error.message : null,
    signingOut,
    signOutError,
    onAccept: () => claimMutation.mutate(),
    onOpenOrg: () => {
      if (invite) navigate(`/my/${invite.organizationSlug}`);
    },
    onSignOut: async () => {
      setSigningOut(true);
      setSignOutError(null);
      const result = await signOut();
      if (result.error) setSignOutError(result.error);
      setSigningOut(false);
    },
  };
}
