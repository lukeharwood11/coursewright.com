import { isSupabaseConfigured, supabase } from "@/infrastructure/supabase/client";

export type Profile = {
  id: string;
  name: string;
  email: string;
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
