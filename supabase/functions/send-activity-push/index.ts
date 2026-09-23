import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { PushMessageError, Urgency } from "jsr:@negrel/webpush@0.5.0";
import { jsonResponse, serviceClient } from "../_shared/mod.ts";
import { loadPushServer } from "../_shared/vapid.ts";
import { activityPushPayload } from "./payload.ts";

type Body = {
  notification_id?: unknown;
};

type NotificationRow = {
  id: number;
  user_id: string;
  kind: string;
  discussion_id: number | null;
  discussion_message_id: number | null;
  announcement_id: number | null;
  student_profile_id: number | null;
  title: string;
  preview: string;
  audience_label: string;
  read_at: string | null;
  organization_id: number;
};

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: { "Content-Type": "application/json" } });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "POST only." }, 405);
  }

  const expected = Deno.env.get("ACTIVITY_PUSH_WEBHOOK_SECRET")?.trim();
  if (!expected) {
    return jsonResponse({ error: "Notifications aren’t available yet." }, 503);
  }

  const provided = request.headers.get("x-webhook-secret") ?? "";
  if (!secretsMatch(provided, expected)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonResponse({ error: "Missing notification." }, 400);
  }

  const notificationId = Number(body.notification_id);
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return jsonResponse({ error: "Missing notification." }, 400);
  }

  try {
    const push = await loadPushServer();
    if (!push) {
      return jsonResponse({ error: "Notifications aren’t available yet." }, 503);
    }

    const db = serviceClient();
    const { data: notification, error: notificationError } = await db
      .from("notifications")
      .select(
        "id, user_id, kind, discussion_id, discussion_message_id, announcement_id, student_profile_id, title, preview, audience_label, read_at, organization_id",
      )
      .eq("id", notificationId)
      .maybeSingle();

    if (notificationError) {
      console.error("activity push load failed", notificationError.message);
      return jsonResponse({ error: "Couldn’t send that notification." }, 500);
    }

    const row = notification as NotificationRow | null;
    if (!row || row.read_at) {
      return jsonResponse({ sent: 0, removed: 0 });
    }

    const { data: organization, error: organizationError } = await db
      .from("organizations")
      .select("slug")
      .eq("id", row.organization_id)
      .maybeSingle();

    if (organizationError || !organization?.slug) {
      console.error("activity push org failed", organizationError?.message ?? "missing");
      return jsonResponse({ error: "Couldn’t send that notification." }, 500);
    }

    const { data: subscriptions, error: subscriptionError } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", row.user_id);

    if (subscriptionError) {
      console.error("activity push subscriptions failed", subscriptionError.message);
      return jsonResponse({ error: "Couldn’t send that notification." }, 500);
    }

    let gradePath: string | null = null;
    if (
      (row.kind === "quiz_grade" || row.kind === "course_final") &&
      row.student_profile_id != null
    ) {
      const { data: profile } = await db
        .from("student_profiles")
        .select("user_id")
        .eq("id", row.student_profile_id)
        .maybeSingle();
      gradePath =
        profile?.user_id === row.user_id
          ? `/my/${organization.slug}/progress`
          : `/my/${organization.slug}/students/${row.student_profile_id}`;
    }

    const payload = activityPushPayload({
      kind: row.kind,
      title: row.title,
      preview: row.preview,
      audienceLabel: row.audience_label,
      orgSlug: organization.slug,
      notificationId: row.id,
      discussionId: row.discussion_id,
      discussionMessageId: row.discussion_message_id,
      announcementId: row.announcement_id,
      gradePath,
    });
    const message = JSON.stringify(payload);

    let sent = 0;
    let removed = 0;
    for (const subscription of (subscriptions ?? []) as SubscriptionRow[]) {
      try {
        const subscriber = push.server.subscribe({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        });
        await subscriber.pushTextMessage(message, {
          ttl: 12 * 60 * 60,
          topic: payload.tag,
          urgency: Urgency.Normal,
        });
        sent += 1;
      } catch (error) {
        if (subscriptionGone(error)) {
          const { error: deleteError } = await db
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
          if (!deleteError) removed += 1;
        } else {
          console.error(
            "activity push send failed",
            error instanceof PushMessageError ? error.response.status : "error",
          );
        }
      }
    }

    return jsonResponse({ sent, removed });
  } catch (error) {
    console.error("activity push failed", error instanceof Error ? error.message : "error");
    return jsonResponse({ error: "Couldn’t send that notification." }, 500);
  }
});

function secretsMatch(provided: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(provided);
  const right = encoder.encode(expected);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

function subscriptionGone(error: unknown): boolean {
  const status = pushStatus(error);
  return status === 404 || status === 410;
}

function pushStatus(error: unknown): number | null {
  if (error instanceof PushMessageError) return error.response.status;
  if (typeof error === "object" && error !== null && "response" in error) {
    const status = (error as { response?: { status?: unknown } }).response?.status;
    return typeof status === "number" ? status : null;
  }
  return null;
}
