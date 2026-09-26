import { updateProfile } from "@/auth/api/profiles";
import type { ValidatedSignUpName } from "@/auth/model/signUpName";
import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

const PENDING_NAME_STEP_KEY = "coursewright:signup-pending-name-step";
const PENDING_PROFILE_NAME_KEY = "coursewright:signup-pending-profile-name";

export function setSignUpPendingNameStep(active: boolean): void {
  if (active) {
    sessionStorage.setItem(PENDING_NAME_STEP_KEY, "1");
  } else {
    sessionStorage.removeItem(PENDING_NAME_STEP_KEY);
  }
}

export function isSignUpPendingNameStep(): boolean {
  return sessionStorage.getItem(PENDING_NAME_STEP_KEY) === "1";
}

export function stashPendingProfileName(name: ValidatedSignUpName): void {
  sessionStorage.setItem(PENDING_PROFILE_NAME_KEY, JSON.stringify(name));
}

export async function applyPendingProfileNameIfNeeded(userId: string): Promise<void> {
  const raw = sessionStorage.getItem(PENDING_PROFILE_NAME_KEY);
  if (!raw || !isSupabaseConfigured || !supabase) return;

  let name: ValidatedSignUpName;
  try {
    name = JSON.parse(raw) as ValidatedSignUpName;
  } catch {
    sessionStorage.removeItem(PENDING_PROFILE_NAME_KEY);
    return;
  }

  sessionStorage.removeItem(PENDING_PROFILE_NAME_KEY);
  await supabase.auth.updateUser({
    data: {
      first_name: name.firstName,
      last_name: name.lastName,
      full_name: name.fullName,
    },
  });
  try {
    await updateProfile(userId, { name: name.fullName });
  } catch {
    // Profile row may not exist yet; auth metadata still has the name.
  }
}
