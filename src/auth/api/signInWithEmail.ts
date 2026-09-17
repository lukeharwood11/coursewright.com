import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

/** Email magic-link / OTP via Supabase Auth. */
export async function signInWithEmail(email: string, nextPath = "/my") {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-in isn’t connected yet. Add Supabase URL and anon key to .env.testing.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}${nextPath}` },
  });

  return { error: error?.message ?? null };
}
