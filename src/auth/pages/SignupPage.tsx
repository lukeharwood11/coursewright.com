import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthScreen } from "@/auth/components/AuthScreen";

export function SignupPage() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Sign up · Course Wright";
  }, []);

  return (
    <AuthScreen
      heading="Create an account"
      subcopy="Plan courses, share materials, and print from one place."
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
