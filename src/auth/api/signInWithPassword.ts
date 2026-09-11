import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

/** Email + password via Supabase Auth. Session is stored by the client. */
export async function signInWithPassword(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-in isn’t connected yet. Add Supabase URL and anon key to .env.local.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}
