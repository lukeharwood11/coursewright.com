import { applyPendingProfileNameIfNeeded } from "@/auth/model/signUpPending";
import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export async function getAuthSession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function subscribeToAuthSession(
  onChange: (user: User | null) => void,
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    onChange(null);
    return () => undefined;
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    if (user) {
      void applyPendingProfileNameIfNeeded(user.id);
    }
    onChange(user);
  });

  return () => data.subscription.unsubscribe();
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: "Accounts aren’t connected yet." };
  }
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}
