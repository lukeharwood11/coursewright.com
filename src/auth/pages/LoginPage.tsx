import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";
import {
  inviteAuthCalloutAction,
  inviteAuthFromSearch,
  inviteAuthGoogleHint,
  inviteAuthSubcopy,
} from "@/auth/model/inviteAuth";
import { applyNoIndexDocumentMeta } from "@/marketing/model/documentMeta";

export function LoginPage() {
  const location = useLocation();
  const invite = inviteAuthFromSearch(location.search);

  useEffect(() => {
    applyNoIndexDocumentMeta("Sign in · Course Wright");
  }, []);

  return (
    <AuthScreen
      heading="Welcome back"
      subcopy={inviteAuthSubcopy("login", invite)}
      invitedEmail={invite.invitedEmail}
      inviteCalloutAction={inviteAuthCalloutAction("login")}
      googleHint={inviteAuthGoogleHint(invite)}
      initialEmail={invite.invitedEmail ?? ""}
      googleLabel="Sign in with Google"
      submitLabel="Sign in"
      passwordSignIn
      footer={
        <>
          <p>
            {invite.fromInvite
              ? "Need an account for this invite? "
              : "New to Course Wright? "}
            <Link
              to={{ pathname: "/signup", search: location.search }}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {invite.fromInvite ? "Create one with that address" : "Create an account"}
            </Link>
            .
          </p>
          {invite.fromInvite ? null : (
            <p className="mt-2">Joining an organization? Ask your admin for an invite.</p>
          )}
        </>
      }
    />
  );
}
