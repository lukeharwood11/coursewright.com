import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";
import { signInWithPassword } from "./signInWithPassword";

function friendlySignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (lower.includes("password") && lower.includes("at least")) {
    return "Use a password with at least 6 characters.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("not confirmed")) {
    return "Check your email to confirm your account, then open Course Wright again.";
  }
  return message;
}

/** Email + password sign-up. Signs the user in when Auth returns a session. */
export async function signUpWithPassword(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-up isn’t connected yet. Add Supabase URL and anon key to .env.testing.",
    };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: friendlySignUpError(error.message) };
  }

  const identities = data.user?.identities ?? [];
  if (data.user && identities.length === 0) {
    return { error: "That email already has an account. Sign in instead." };
  }

  if (data.session) {
    return { error: null };
  }

  const signedIn = await signInWithPassword(email, password);
  if (signedIn.error) {
    return { error: friendlySignUpError(signedIn.error) };
  }
  return { error: null };
}
