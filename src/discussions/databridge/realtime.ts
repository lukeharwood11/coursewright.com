import { supabase } from "@/infrastructure/supabase/client";
import { requireSupabase } from "./client";

export function subscribeToOrgDiscussions(
  organizationId: number,
  onChange: () => void,
): () => void {
  if (!supabase) return () => undefined;
  const db = requireSupabase();
  const channel = db
    .channel(`discussions-org-${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "discussions",
        filter: `organization_id=eq.${organizationId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void db.removeChannel(channel);
  };
}

export function subscribeToDiscussionThread(
  discussionId: number,
  onChange: () => void,
): () => void {
  if (!supabase) return () => undefined;
  const db = requireSupabase();
  const channel = db
    .channel(`discussion-thread-${discussionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "discussions",
        filter: `id=eq.${discussionId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "discussion_messages",
        filter: `discussion_id=eq.${discussionId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "discussion_message_attachments",
      },
      onChange,
    )
    .subscribe();

  return () => {
    void db.removeChannel(channel);
  };
}
