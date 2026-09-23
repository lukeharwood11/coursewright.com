import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, serviceClient, userFromRequest } from "../_shared/mod.ts";

const RESEND_EVENTS_URL = "https://api.resend.com/events/send";
/** HN-019 — Resend event template `report-card`, then deploy this function. */
const REPORT_CARD_EVENT = "report-card";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://beta.coursewright.com",
  "https://coursewright.com",
];

type Body = { instanceId?: unknown };

type CardRow = {
  id: number;
  organization_id: number;
  course_id: number;
  student_profile_id: number;
  narrative: string;
  snapshot: {
    student_name?: string;
    course_title?: string;
    final_percent?: number | null;
    final_label?: string | null;
    override_label?: string | null;
    items?: Array<{ title?: string; percent?: number | null; label?: string | null; locked?: boolean }>;
  };
};

type DeliveryRow = {
  id: number;
  recipient_kind: string;
  recipient_email: string | null;
  recipient_user_id: string | null;
  status: string;
  channel: string;
  attempt_count: number;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await userFromRequest(request);
    if (!user) return jsonResponse({ error: "Sign in to send a report card." }, 401);

    const body = (await request.json()) as Body;
    const instanceId = Number(body.instanceId);
    if (!Number.isFinite(instanceId) || instanceId <= 0) {
      return jsonResponse({ error: "Pick a report card to email." }, 400);
    }

    const db = serviceClient();
    const { data: card, error: cardError } = await db
      .from("report_card_instances")
      .select("id, organization_id, course_id, student_profile_id, narrative, snapshot")
      .eq("id", instanceId)
      .maybeSingle();
    if (cardError) throw cardError;
    if (!card) return jsonResponse({ error: "We couldn’t find that report card." }, 404);

    const typed = card as CardRow;
    const allowed = await canSend(db, user.id, typed.organization_id, typed.course_id);
    if (!allowed) return jsonResponse({ error: "You can’t email that report card." }, 403);

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    const origin = publicAppOrigin(request);
    const { data: organization } = await db
      .from("organizations")
      .select("name, slug")
      .eq("id", typed.organization_id)
      .maybeSingle();
    const org = organization as { name: string; slug: string } | null;

    const { data: deliveries, error: deliveryError } = await db
      .from("report_card_deliveries")
      .select("id, recipient_kind, recipient_email, recipient_user_id, status, channel, attempt_count")
      .eq("report_card_instance_id", typed.id)
      .eq("channel", "email")
      .eq("status", "queued");
    if (deliveryError) throw deliveryError;

    const queued = (deliveries ?? []) as DeliveryRow[];
    if (!apiKey || !origin || !org?.slug) {
      const reason = !apiKey
        ? "Report card email isn’t set up yet (HN-019)."
        : "Couldn’t build the report card link.";
      for (const row of queued) {
        await markFailed(db, row, reason);
      }
      return jsonResponse({ error: reason, queued: queued.length }, apiKey ? 500 : 503);
    }

    const link = `${origin}/my/${org.slug}/report-cards/${typed.id}`;
    const summary = summaryText(typed);
    let sent = 0;
    let failed = 0;
    for (const row of queued) {
      const email = await resolveEmail(db, row, typed.student_profile_id);
      if (!email) {
        await markFailed(db, row, "No email on file.");
        failed += 1;
        continue;
      }
      try {
        await sendResendEvent(apiKey, email, {
          organization_name: org.name,
          student_name: typed.snapshot.student_name ?? "Student",
          course_title: typed.snapshot.course_title ?? "Course",
          narrative: typed.narrative ?? "",
          grade_summary: summary,
          report_card_link: link,
          recipient_kind: row.recipient_kind,
        });
        await db
          .from("report_card_deliveries")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            recipient_email: email,
            last_error: null,
            attempt_count: row.attempt_count + 1,
          })
          .eq("id", row.id);
        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Email failed.";
        await markFailed(db, row, message);
        failed += 1;
      }
    }

    return jsonResponse({ sent, failed, event: REPORT_CARD_EVENT });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn’t send that report card.";
    return jsonResponse({ error: message }, 500);
  }
});

async function canSend(
  db: ReturnType<typeof serviceClient>,
  userId: string,
  organizationId: number,
  courseId: number,
): Promise<boolean> {
  const { data: membership } = await db
    .from("memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role;
  if (role === "owner" || role === "admin") return true;
  if (role !== "instructor") return false;
  const { data: teaching } = await db
    .from("course_instructors")
    .select("user_id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(teaching);
}

async function resolveEmail(
  db: ReturnType<typeof serviceClient>,
  row: DeliveryRow,
  studentProfileId: number,
): Promise<string | null> {
  if (row.recipient_email) return row.recipient_email;
  if (row.recipient_kind === "student") {
    const { data } = await db
      .from("student_profiles")
      .select("student_email")
      .eq("id", studentProfileId)
      .maybeSingle();
    const email = (data as { student_email: string | null } | null)?.student_email;
    return email?.trim() ? email.trim().toLowerCase() : null;
  }
  if (row.recipient_user_id) {
    const { data } = await db
      .from("profiles")
      .select("email")
      .eq("id", row.recipient_user_id)
      .maybeSingle();
    const email = (data as { email: string | null } | null)?.email;
    return email?.trim() ? email.trim().toLowerCase() : null;
  }
  return null;
}

async function markFailed(
  db: ReturnType<typeof serviceClient>,
  row: DeliveryRow,
  message: string,
) {
  const attempts = row.attempt_count + 1;
  await db
    .from("report_card_deliveries")
    .update({
      status: "failed",
      attempt_count: attempts,
      last_error: attempts >= 3 ? `${message} (stopped after 3 tries)` : message,
    })
    .eq("id", row.id);
}

function summaryText(card: CardRow): string {
  const snapshot = card.snapshot ?? {};
  const lines = (snapshot.items ?? []).map((item) => {
    if (!item.locked) return `${item.title ?? "Quiz"}: not graded`;
    const percent = item.percent == null ? "" : `${item.percent}%`;
    const label = item.label ? ` ${item.label}` : "";
    return `${item.title ?? "Quiz"}: ${percent}${label}`.trim();
  });
  const finalLabel = snapshot.override_label || snapshot.final_label;
  const finalPercent = snapshot.final_percent == null ? "No final yet" : `${snapshot.final_percent}%`;
  lines.push(`Final: ${finalPercent}${finalLabel ? ` ${finalLabel}` : ""}`);
  return lines.join("\n");
}

function publicAppOrigin(request: Request): string | null {
  const site = Deno.env.get("SITE_URL")?.trim().replace(/\/$/, "");
  if (site) return site;
  const origin = request.headers.get("origin")?.trim().replace(/\/$/, "");
  if (origin && DEFAULT_ALLOWED_ORIGINS.includes(origin)) return origin;
  return null;
}

async function sendResendEvent(
  apiKey: string,
  email: string,
  payload: Record<string, string>,
): Promise<void> {
  const response = await fetch(RESEND_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: REPORT_CARD_EVENT,
      email,
      payload,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Email service rejected the report card.");
  }
}
