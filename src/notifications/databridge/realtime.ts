import { supabase } from "@/infrastructure/supabase/client";
import { requireSupabase } from "./client";

export function subscribeToOrgNotifications(
  organizationId: number,
  userId: string,
  onChange: () => void,
): () => void {
  if (!supabase) return () => undefined;
  const db = requireSupabase();
  const channel = db
    .channel(`notifications-org-${organizationId}-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void db.removeChannel(channel);
  };
}
