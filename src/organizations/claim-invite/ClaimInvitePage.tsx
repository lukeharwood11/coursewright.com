import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ClaimInviteCard } from "./components/ClaimInviteCard";
import { useClaimInvite } from "./hooks/useClaimInvite";

export function ClaimInvitePage() {
  const { token } = useParams();
  const claim = useClaimInvite(token);

  useEffect(() => {
    document.title = "Invite · Course Wright";
  }, []);

  return (
    <ClaimInviteCard
      loading={claim.loading}
      loadError={claim.loadError}
      notFound={claim.notFound}
      invite={claim.invite}
      alreadyAccepted={claim.alreadyAccepted}
      canAccept={claim.canAccept}
      claiming={claim.claiming}
      claimError={claim.claimError}
      onAccept={claim.onAccept}
      onOpenOrg={claim.onOpenOrg}
    />
  );
}
