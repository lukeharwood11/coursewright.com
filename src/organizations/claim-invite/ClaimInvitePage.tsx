import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { applyNoIndexDocumentMeta } from "@/marketing/model/documentMeta";
import { useToastOnError } from "@/ui/useToastOnError";
import { ClaimInviteCard } from "./components/ClaimInviteCard";
import { useClaimInvite } from "./hooks/useClaimInvite";

export function ClaimInvitePage() {
  const { token } = useParams();
  const claim = useClaimInvite(token);
  useToastOnError(claim.loadError);
  useToastOnError(claim.claimError);
  useToastOnError(claim.signOutError);

  useEffect(() => {
    applyNoIndexDocumentMeta("Invite · Course Wright");
  }, []);

  return (
    <ClaimInviteCard
      loading={claim.loading}
      loadError={claim.loadError}
      notFound={claim.notFound}
      invite={claim.invite}
      alreadyAccepted={claim.alreadyAccepted}
      signedIn={claim.signedIn}
      signedInEmail={claim.signedInEmail}
      needsAccount={claim.needsAccount}
      wrongAccount={claim.wrongAccount}
      signupHref={claim.signupHref}
      loginHref={claim.loginHref}
      canAccept={claim.canAccept}
      claiming={claim.claiming}
      claimError={null}
      signingOut={claim.signingOut}
      signOutError={null}
      onAccept={claim.onAccept}
      onOpenOrg={claim.onOpenOrg}
      onSignOut={() => void claim.onSignOut()}
    />
  );
}
