import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";
import { profileWriteErrorMessage } from "@/auth/model/profile";

export type Profile = {
  id: string;
  name: string;
  email: string;
};

export const profileQueryKeys = {
  detail: (userId: string) => ["profiles", userId] as const,
};

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return { id: data.id, name: data.name, email: data.email };
}

export async function updateProfile(
  userId: string,
  input: { name: string },
): Promise<Profile> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Accounts aren’t connected yet.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ name: input.name })
    .eq("id", userId)
    .select("id, name, email")
    .maybeSingle();

  if (error) throw new Error(profileWriteErrorMessage(error));
  if (!data) {
    throw new Error(
      "Your profile isn’t ready yet. Sign out, sign back in, and try again.",
    );
  }
  return { id: data.id, name: data.name, email: data.email };
}
