import {
  parseActivityKind,
  type ActivityItem,
} from "@/notifications/model/activity";
import { requireSupabase } from "./client";

export const notificationQueryKeys = {
  org: (organizationId: number, userId: string) =>
    ["notifications", "org", organizationId, userId] as const,
};

type NotificationRow = {
  id: number;
  organization_id: number;
  kind: string;
  discussion_id: number | null;
  discussion_message_id: number | null;
  actor_id: string | null;
  title: string;
  preview: string;
  audience_label: string;
  created_at: string;
  read_at: string | null;
  actor?: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toActivityItem(row: NotificationRow): ActivityItem | null {
  const kind = parseActivityKind(row.kind);
  if (!kind) return null;
  const actor = one(row.actor);
  const actorName = actor?.name?.trim() || "Someone";
  return {
    id: row.id,
    organizationId: row.organization_id,
    kind,
    discussionId: row.discussion_id,
    discussionMessageId: row.discussion_message_id,
    actorId: row.actor_id,
    actorName,
    title: row.title,
    preview: row.preview,
    audienceLabel: row.audience_label,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function listNotifications(
  organizationId: number,
): Promise<ActivityItem[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("notifications")
    .select(
      "id, organization_id, kind, discussion_id, discussion_message_id, actor_id, title, preview, audience_label, created_at, read_at, actor:profiles!notifications_actor_id_fkey(name)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const item = toActivityItem(row as NotificationRow);
    return item ? [item] : [];
  });
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) throw new Error(error.message);
}

export async function markDiscussionNotificationsRead(
  discussionId: number,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("discussion_id", discussionId)
    .eq("kind", "discussion_message")
    .is("read_at", null);

  if (error) throw new Error(error.message);
}
