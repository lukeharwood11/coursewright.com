import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";

export function LoginPage() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Sign in · Course Wright";
  }, []);

  return (
    <AuthScreen
      heading="Welcome back"
      subcopy="Sign in to see your courses and materials."
      googleLabel="Sign in with Google"
      submitLabel="Sign in"
      passwordSignIn
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
