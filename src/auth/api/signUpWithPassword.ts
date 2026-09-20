import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

export type SignUpResult = {
  error: string | null;
  /** Account created; Auth requires email confirmation before a session exists. */
  needsEmailVerification?: boolean;
};

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
  if (lower.includes("rate limit")) {
    return "Too many attempts just now. Wait a minute and try again.";
  }
  return message;
}

/** Email + password sign-up. Signs the user in when Auth returns a session. */
export async function signUpWithPassword(
  email: string,
  password: string,
  nextPath = "/my",
): Promise<SignUpResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-up isn’t connected yet. Add Supabase URL and anon key to .env.testing.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Confirmation emails (when enabled) land here. Default `/my`; invite
      // flows pass `/invite/<token>` via `next` so that takes priority.
      emailRedirectTo: `${window.location.origin}${nextPath}`,
    },
  });
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

  // Confirmations on: account exists, no session until they open the email link.
  return { error: null, needsEmailVerification: true };
}
