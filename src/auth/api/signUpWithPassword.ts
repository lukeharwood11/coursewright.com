import { signInWithPassword } from "@/auth/api/signInWithPassword";
import { updateProfile } from "@/auth/api/profiles";
import {
  setSignUpPendingNameStep,
  stashPendingProfileName,
} from "@/auth/model/signUpPending";
import { friendlyCaptchaAuthError } from "@/auth/model/captchaAuthError";
import type { ValidatedSignUpName } from "@/auth/model/signUpName";
import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

export type SignUpResult = {
  error: string | null;
  /** Account created; Auth requires email confirmation before a session exists. */
  needsEmailVerification?: boolean;
};

export const SIGN_UP_EMAIL_TAKEN_MESSAGE =
  "That email already has an account. Sign in instead.";

function friendlySignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return SIGN_UP_EMAIL_TAKEN_MESSAGE;
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
  return friendlyCaptchaAuthError(message) ?? message;
}

export type SignUpName = ValidatedSignUpName;

/** Step 1: create the account (or detect a duplicate email) before collecting a name. */
export async function beginPasswordSignUp(
  email: string,
  password: string,
  nextPath = "/my",
  getCaptchaToken?: () => Promise<string | undefined>,
): Promise<SignUpResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-up isn’t connected yet. Add Supabase URL and anon key to .env.testing.",
    };
  }

  const probeCaptchaToken = getCaptchaToken ? await getCaptchaToken() : undefined;
  const signIn = await signInWithPassword(email, password, probeCaptchaToken);
  if (!signIn.error) {
    await supabase.auth.signOut();
    return { error: SIGN_UP_EMAIL_TAKEN_MESSAGE };
  }

  const signUpCaptchaToken = getCaptchaToken ? await getCaptchaToken() : probeCaptchaToken;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${nextPath}`,
      captchaToken: signUpCaptchaToken,
      data: {
        first_name: "",
        last_name: "",
        full_name: "",
      },
    },
  });
  if (error) {
    return { error: friendlySignUpError(error.message) };
  }

  const identities = data.user?.identities ?? [];
  if (data.user && identities.length === 0) {
    return { error: SIGN_UP_EMAIL_TAKEN_MESSAGE };
  }

  setSignUpPendingNameStep(true);

  return { error: null };
}

/** Step 2: save the display name after credentials sign-up began on step 1. */
export async function completePasswordSignUp(name: SignUpName): Promise<SignUpResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      error:
        "Sign-up isn’t connected yet. Add Supabase URL and anon key to .env.testing.",
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        first_name: name.firstName,
        last_name: name.lastName,
        full_name: name.fullName,
      },
    });
    if (metaError) {
      return { error: friendlySignUpError(metaError.message) };
    }

    try {
      await updateProfile(session.user.id, { name: name.fullName });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save your name.";
      return { error: message };
    }

    setSignUpPendingNameStep(false);
    return { error: null };
  }

  stashPendingProfileName(name);
  setSignUpPendingNameStep(false);
  return { error: null, needsEmailVerification: true };
}
