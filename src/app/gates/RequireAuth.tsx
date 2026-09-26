import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthSession } from "@/auth/hooks/useAuthSession";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { isSignUpPendingNameStep } from "@/auth/model/signUpPending";
import { safeNextPath } from "@/auth/model/safeNext";
import { PageLoading } from "@/ui/PageLoading";

export function RequireAuth() {
  const session = useAuthSession();
  const location = useLocation();

  if (session.status === "loading") {
    return <AuthLoading />;
  }

  if (!session.user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet context={{ user: session.user } satisfies AuthedOutletContext} />;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const session = useAuthSession();
  const location = useLocation();

  if (session.status === "loading") {
    return <AuthLoading />;
  }

  if (session.user) {
    const next = new URLSearchParams(location.search).get("next");
    return <Navigate to={safeNextPath(next)} replace />;
  }

  return children;
}

/** Signup stays available while the person finishes the name step after step-1 sign-up. */
export function SignupRedirectIfAuthed({ children }: { children: ReactNode }) {
  const session = useAuthSession();
  const location = useLocation();

  if (session.status === "loading") {
    return <AuthLoading />;
  }

  if (session.user && !isSignUpPendingNameStep()) {
    const next = new URLSearchParams(location.search).get("next");
    return <Navigate to={safeNextPath(next)} replace />;
  }

  return children;
}

function AuthLoading() {
  return <PageLoading fullScreen label="Loading…" />;
}
