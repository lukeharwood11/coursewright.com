import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";
import { safeNextPath } from "@/auth/model/safeNext";

export function SignupPage() {
  const location = useLocation();
  const fromInvite = safeNextPath(
    new URLSearchParams(location.search).get("next"),
  ).startsWith("/invite/");

  useEffect(() => {
    document.title = "Sign up · Course Wright";
  }, []);

  return (
    <AuthScreen
      heading="Create an account"
      subcopy={
        fromInvite
          ? "Create an account with the email you were invited with."
          : "Plan courses, share materials, and print from one place."
      }
      googleLabel="Sign up with Google"
      submitLabel="Create account"
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
