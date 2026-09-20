import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

/** Google OAuth via Supabase Auth (provider enabled in dashboard). */
export async function signInWithGoogle(nextPath = "/my") {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-in isn’t connected yet. Add Supabase URL and anon key to .env.testing.",
    };
  }

  const redirectTo = `${window.location.origin}${nextPath}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      // After Course Wright sign-out, Google still has a browser session.
      // Without this, OAuth silently reuses that account (no picker).
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
