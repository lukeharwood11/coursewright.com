import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthSession } from "@/auth/hooks/useAuthSession";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { safeNextPath } from "@/auth/model/safeNext";
import { Wordmark } from "@/ui/Wordmark";

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

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <div className="text-center">
        <Wordmark size="login" />
        <p className="mt-4 text-[13.5px] text-[var(--ink-soft)]">Loading…</p>
      </div>
    </main>
  );
}
