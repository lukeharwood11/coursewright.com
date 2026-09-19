import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";
import {
  inviteAuthCalloutAction,
  inviteAuthFromSearch,
  inviteAuthGoogleHint,
  inviteAuthSubcopy,
} from "@/auth/model/inviteAuth";

export function SignupPage() {
  const location = useLocation();
  const invite = inviteAuthFromSearch(location.search);

  useEffect(() => {
    document.title = "Sign up · Course Wright";
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
