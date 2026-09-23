import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, serviceClient, userFromRequest } from "../_shared/mod.ts";

const RESEND_EVENTS_URL = "https://api.resend.com/events/send";
const ORGANIZATION_INVITE_EVENT = "organization-invite";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://beta.coursewright.com",
  "https://coursewright.com",
];

type Body = {
  inviteId?: unknown;
};

type InviteRow = {
  id: number;
  email: string;
  role: string;
  token: string;
  accepted_at: string | null;
  invited_by: string;
  organization_id: number;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const user = await userFromRequest(request);
    if (!user) {
      return jsonResponse({ error: "Sign in to send an invite email." }, 401);
    }

    const body = (await request.json()) as Body;
    const inviteId = Number(body.inviteId);
    if (!Number.isFinite(inviteId) || inviteId <= 0) {
      return jsonResponse({ error: "Pick an invite to email." }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      // HN-015 — set RESEND_API_KEY as a Supabase Edge Function secret.
      return jsonResponse(
        { error: "Invite email isn’t set up yet. Copy the link and send it yourself." },
        503,
      );
    }

    const origin = publicAppOrigin(request);
    if (!origin) {
      return jsonResponse(
        { error: "Couldn’t build the invite link. Copy it from the app instead." },
        500,
      );
    }

    const db = serviceClient();
    const { data: invite, error: inviteError } = await db
      .from("admin_invites")
      .select("id, email, role, token, accepted_at, invited_by, organization_id")
      .eq("id", inviteId)
      .maybeSingle();
    if (inviteError) throw inviteError;
    if (!invite) {
      return jsonResponse({ error: "We couldn’t find that invite." }, 404);
    }

    const typedInvite = invite as InviteRow;
    if (typedInvite.accepted_at) {
      return jsonResponse({ error: "That invite was already accepted." }, 409);
    }

    const { data: membership, error: membershipError } = await db
      .from("memberships")
      .select("role")
      .eq("organization_id", typedInvite.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!canSendInviteEmail(typedInvite.role, membership?.role ?? null)) {
      return jsonResponse({ error: "You can’t email that invite." }, 403);
    }

    const { data: organization, error: organizationError } = await db
      .from("organizations")
      .select("name")
      .eq("id", typedInvite.organization_id)
      .maybeSingle();
    if (organizationError) throw organizationError;
    if (!organization?.name) {
      return jsonResponse({ error: "We couldn’t find that organization." }, 404);
    }

    const [sender, invitee] = await Promise.all([
      loadProfile(db, { id: typedInvite.invited_by }),
      loadProfile(db, { email: typedInvite.email }),
    ]);
    const senderProfile = sender ?? {
      id: user.id,
      email: user.email ?? "",
      name: "",
    };

    const payload = {
      user_email: typedInvite.email,
      invite_link: `${origin}/invite/${typedInvite.token}`,
      sender_email: senderProfile.email || user.email || "",
      user_first_name: firstNameForInvite(invitee?.name, typedInvite.email),
      sender_full_name: displayName(senderProfile.name, senderProfile.email || user.email || ""),
      organization_name: organization.name,
    };

    await sendResendEvent(apiKey, typedInvite.email, payload);
    return jsonResponse({ sent: true, event: ORGANIZATION_INVITE_EVENT });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn’t send that invite email.";
    return jsonResponse({ error: message }, 500);
  }
});

function canSendInviteEmail(inviteRole: string, membershipRole: string | null): boolean {
  if (membershipRole == null) return false;
  if (inviteRole === "parent" || inviteRole === "student") {
    return membershipRole === "owner" || membershipRole === "admin" || membershipRole === "instructor";
  }
  if (inviteRole === "owner" || inviteRole === "admin" || inviteRole === "instructor") {
    return membershipRole === "owner" || membershipRole === "admin";
  }
  return false;
}

function publicAppOrigin(request: Request): string | null {
  const allowed = new Set(DEFAULT_ALLOWED_ORIGINS);
  const siteUrl = parseOrigin(Deno.env.get("SITE_URL") ?? null);
  if (siteUrl) allowed.add(siteUrl);

  const fromHeader = parseOrigin(request.headers.get("origin"));
  if (fromHeader && allowed.has(fromHeader)) return fromHeader;
  return siteUrl;
}

function parseOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function firstNameForInvite(name: string | null | undefined, email: string): string {
  const fromName = (name ?? "").trim().split(/\s+/).filter(Boolean)[0];
  if (fromName) return fromName;
  const local = email.split("@")[0]?.trim() ?? "";
  return local || email;
}

function displayName(name: string, email: string): string {
  const trimmed = name.trim();
  return trimmed || email;
}

async function loadProfile(
  db: ReturnType<typeof serviceClient>,
  lookup: { id: string } | { email: string },
): Promise<ProfileRow | null> {
  let query = db.from("profiles").select("id, email, name");
  query = "id" in lookup ? query.eq("id", lookup.id) : query.eq("email", lookup.email);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

async function sendResendEvent(
  apiKey: string,
  email: string,
  payload: {
    user_email: string;
    invite_link: string;
    sender_email: string;
    user_first_name: string;
    sender_full_name: string;
    organization_name: string;
  },
): Promise<void> {
  const response = await fetch(RESEND_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: ORGANIZATION_INVITE_EVENT,
      email,
      payload,
    }),
  });

  if (response.ok) return;

  const detail = await response.text().catch(() => "");
  console.error("Resend organization-invite failed", response.status, detail);
  throw new Error("Couldn’t send the invite email. Copy the link and send it yourself.");
}
