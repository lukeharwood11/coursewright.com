import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";
import { safeNextPath } from "@/auth/model/safeNext";

export function LoginPage() {
  const location = useLocation();
  const fromInvite = safeNextPath(
    new URLSearchParams(location.search).get("next"),
  ).startsWith("/invite/");

  useEffect(() => {
    document.title = "Sign in · Course Wright";
  }, []);

  return (
    <AuthScreen
      heading="Welcome back"
      subcopy={
        fromInvite
          ? "Sign in with the email you were invited with to accept."
          : "Sign in to see your courses and materials."
      }
      googleLabel="Sign in with Google"
      submitLabel="Continue"
      footer={
        <>
          <p>
            New to Course Wright?{" "}
            <Link
              to={{ pathname: "/signup", search: location.search }}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Create an account
            </Link>
            .
          </p>
          <p className="mt-2">Joining a co-op? Ask your admin for an invite.</p>
        </>
      }
    />
  );
}
