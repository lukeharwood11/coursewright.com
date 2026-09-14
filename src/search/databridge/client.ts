import { supabase } from "@/infrastructure/supabase/client";

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Accounts aren’t connected yet. Add Supabase URL and anon key to .env.development.",
    );
  }
  return supabase;
}
