import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, serviceClient, userFromRequest } from "../_shared/mod.ts";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const FEEDBACK_TO = "hi@coursewright.com";
const FEEDBACK_FROM = "Course Wright <hi@coursewright.com>";

type Body = {
  feedbackId?: unknown;
};

type FeedbackRow = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  org_name: string | null;
  org_slug: string | null;
  role: string | null;
  page_path: string | null;
  message: string;
  created_at: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await userFromRequest(request);
    if (!user) {
      return jsonResponse({ error: "Sign in to send feedback." }, 401);
    }

    const body = (await request.json()) as Body;
    const feedbackId = Number(body.feedbackId);
    if (!Number.isFinite(feedbackId) || feedbackId <= 0) {
      return jsonResponse({ error: "Pick a note to send." }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      // HN-015 — same secret as invite / announcement mail.
      return jsonResponse(
        { error: "Feedback email isn’t set up yet. We still saved your note." },
        503,
      );
    }

    const db = serviceClient();
    const { data: row, error: loadError } = await db
      .from("feedback")
      .select(
        "id, user_id, name, email, org_name, org_slug, role, page_path, message, created_at",
      )
      .eq("id", feedbackId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!row) {
      return jsonResponse({ error: "We couldn’t find that note." }, 404);
    }

    const typed = row as FeedbackRow;
    if (typed.user_id !== user.id) {
      return jsonResponse({ error: "You can’t send that note." }, 403);
    }

    await sendFeedbackEmail(apiKey, typed);
    return jsonResponse({ sent: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn’t email that note.";
    return jsonResponse({ error: message }, 500);
  }
});

async function sendFeedbackEmail(apiKey: string, row: FeedbackRow): Promise<void> {
  const orgLine = row.org_name
    ? `${row.org_name}${row.org_slug ? ` (/my/${row.org_slug})` : ""}`
    : "None selected";
  const text = [
    row.message,
    "",
    "—",
    `Name: ${row.name}`,
    `Email: ${row.email}`,
    `Organization: ${orgLine}`,
    `Role: ${row.role ?? "—"}`,
    `Page: ${row.page_path ?? "—"}`,
    `When: ${row.created_at}`,
  ].join("\n");

  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FEEDBACK_FROM,
      to: [FEEDBACK_TO],
      reply_to: row.email,
      subject: `Feedback from ${row.name}`,
      text,
    }),
  });

  if (response.ok) return;

  const detail = await response.text().catch(() => "");
  console.error("Resend product-feedback failed", response.status, detail);
  throw new Error("Couldn’t email that note. We still saved it.");
}
