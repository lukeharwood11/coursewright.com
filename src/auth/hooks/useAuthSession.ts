import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/infrastructure/supabase/client";
import { getAuthSession, subscribeToAuthSession } from "@/auth/api/session";

export type AuthSessionState =
  | { status: "loading"; user: null }
  | { status: "ready"; user: User | null };

export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ status: "ready", user: null });
      return;
    }

    let cancelled = false;

    void getAuthSession().then((session) => {
      if (!cancelled) {
        setState({ status: "ready", user: session?.user ?? null });
      }
    });

    const unsubscribe = subscribeToAuthSession((user) => {
      if (!cancelled) setState({ status: "ready", user });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return state;
}
