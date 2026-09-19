import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";
import {
  inviteAuthCalloutAction,
  inviteAuthFromSearch,
  inviteAuthGoogleHint,
  inviteAuthSubcopy,
} from "@/auth/model/inviteAuth";
import { applyPublicDocumentMeta } from "@/marketing/model/documentMeta";
import { publicSeoPageForPath } from "@/marketing/model/publicSeo";

export function SignupPage() {
  const location = useLocation();
  const invite = inviteAuthFromSearch(location.search);

  useEffect(() => {
    applyPublicDocumentMeta(publicSeoPageForPath("/signup"));
  }, []);

  return (
    <AuthScreen
      heading="Create an account"
      subcopy={inviteAuthSubcopy("signup", invite)}
      invitedEmail={invite.invitedEmail}
      inviteCalloutAction={inviteAuthCalloutAction("signup")}
      googleHint={inviteAuthGoogleHint(invite)}
      initialEmail={invite.invitedEmail ?? ""}
      googleLabel="Sign up with Google"
      submitLabel="Create account"
      passwordSignUp
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to={{ pathname: "/login", search: location.search }}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Sign in
          </Link>
        </p>
      }
    />
  );
}
