import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonResponse, serviceClient, userFromRequest } from "../_shared/mod.ts";

const RESEND_EVENTS_URL = "https://api.resend.com/events/send";
const ANNOUNCEMENT_NOTIFICATION_EVENT = "announcement-notification";
const SEND_CONCURRENCY = 5;

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://beta.coursewright.com",
  "https://coursewright.com",
];

type Body = {
  announcementId?: unknown;
};

type AnnouncementRow = {
  id: number;
  organization_id: number;
  audience: string;
  course_ids: number[] | null;
  class_ids: number[] | null;
  student_profile_ids: number[] | null;
  title: string;
  body: string;
  deleted_at: string | null;
};

type MembershipRow = {
  role: string;
};

type OrganizationRow = {
  name: string;
  slug: string;
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
      return jsonResponse({ error: "Sign in to send a notification." }, 401);
    }

    const body = (await request.json()) as Body;
    const announcementId = Number(body.announcementId);
    if (!Number.isFinite(announcementId) || announcementId <= 0) {
      return jsonResponse({ error: "Pick an announcement to email." }, 400);
    }

    const db = serviceClient();
    const { data: announcement, error: announcementError } = await db
      .from("announcements")
      .select(
        "id, organization_id, audience, course_ids, class_ids, student_profile_ids, title, body, deleted_at",
      )
      .eq("id", announcementId)
      .maybeSingle();
    if (announcementError) throw announcementError;
    if (!announcement) {
      return jsonResponse({ error: "We couldn’t find that announcement." }, 404);
    }

    const typed = announcement as AnnouncementRow;
    if (typed.deleted_at) {
      return jsonResponse({ error: "That announcement was removed." }, 409);
    }

    const { data: membership, error: membershipError } = await db
      .from("memberships")
      .select("role")
      .eq("organization_id", typed.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError) throw membershipError;
    const role = (membership as MembershipRow | null)?.role ?? null;
    const allowed = await canSendNotification(db, {
      role,
      userId: user.id,
      organizationId: typed.organization_id,
      audience: typed.audience,
      courseIds: asIdList(typed.course_ids),
      classIds: asIdList(typed.class_ids),
      studentIds: asIdList(typed.student_profile_ids),
    });
    if (!allowed) {
      return jsonResponse({ error: "You can’t email that announcement." }, 403);
    }

    const { error: notifyError } = await db.rpc("notify_announcement", {
      p_announcement_id: typed.id,
      p_actor_id: user.id,
    });
    if (notifyError) throw notifyError;

    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      return jsonResponse(
        { error: "Notification email isn’t set up yet. Families can still see it in Activity." },
        503,
      );
    }

    const origin = publicAppOrigin(request);
    if (!origin) {
      return jsonResponse(
        { error: "Couldn’t build the announcement link." },
        500,
      );
    }

    const { data: organization, error: organizationError } = await db
      .from("organizations")
      .select("name, slug")
      .eq("id", typed.organization_id)
      .maybeSingle();
    if (organizationError) throw organizationError;
    const org = organization as OrganizationRow | null;
    if (!org?.name || !org.slug) {
      return jsonResponse({ error: "We couldn’t find that organization." }, 404);
    }

    const names = await loadTargetNames(db, typed);
    const studentIds = await loadAffectedStudentIds(db, typed);
    const emails = await loadRecipientEmails(db, typed.organization_id, studentIds);

    const sender = (await loadProfile(db, user.id)) ?? {
      id: user.id,
      email: user.email ?? "",
      name: "",
    };

    const payload = {
      announcement_title: typed.title,
      announcement_body: typed.body ?? "",
      organization_name: org.name,
      announcement_link: `${origin}/my/${org.slug}/announcements/${typed.id}`,
      sender_full_name: displayName(sender.name, sender.email || user.email || ""),
      audience_summary: announcementTargetSummary(names),
      audience_list: announcementTargetList(names),
    };

    let sent = 0;
    let failed = 0;
    for (let index = 0; index < emails.length; index += SEND_CONCURRENCY) {
      const chunk = emails.slice(index, index + SEND_CONCURRENCY);
      const results = await Promise.all(
        chunk.map((email) =>
          sendResendEvent(apiKey, email, payload).then(
            () => true,
            () => false,
          ),
        ),
      );
      for (const ok of results) {
        if (ok) sent += 1;
        else failed += 1;
      }
    }

    return jsonResponse({ sent, failed, event: ANNOUNCEMENT_NOTIFICATION_EVENT });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn’t send that notification email.";
    return jsonResponse({ error: message }, 500);
  }
});

async function canSendNotification(
  db: ReturnType<typeof serviceClient>,
  args: {
    role: string | null;
    userId: string;
    organizationId: number;
    audience: string;
    courseIds: number[];
    classIds: number[];
    studentIds: number[];
  },
): Promise<boolean> {
  if (args.role !== "owner" && args.role !== "admin" && args.role !== "instructor") {
    return false;
  }
  if (args.audience === "course") {
    if (args.courseIds.length === 0) return false;
    if (args.role === "owner" || args.role === "admin") return true;
    const { data, error } = await db
      .from("course_instructors")
      .select("course_id")
      .eq("user_id", args.userId)
      .in("course_id", args.courseIds);
    if (error) throw error;
    const taught = new Set((data ?? []).map((row) => row.course_id as number));
    return args.courseIds.every((id) => taught.has(id));
  }
  if (args.audience === "class") {
    if (args.classIds.length === 0) return false;
    const { data, error } = await db
      .from("classes")
      .select("id")
      .eq("organization_id", args.organizationId)
      .is("deleted_at", null)
      .in("id", args.classIds);
    if (error) throw error;
    return (data ?? []).length === args.classIds.length;
  }
  if (args.audience === "student") {
    if (args.studentIds.length === 0) return false;
    const { data, error } = await db
      .from("org_profiles")
      .select("id")
      .eq("organization_id", args.organizationId)
      .in("id", args.studentIds);
    if (error) throw error;
    return (data ?? []).length === args.studentIds.length;
  }
  return false;
}

async function loadTargetNames(
  db: ReturnType<typeof serviceClient>,
  announcement: AnnouncementRow,
): Promise<string[]> {
  if (announcement.audience === "course") {
    return loadOrderedLabels(db, "courses", "title", asIdList(announcement.course_ids), "Course");
  }
  if (announcement.audience === "class") {
    return loadOrderedLabels(db, "classes", "title", asIdList(announcement.class_ids), "Class");
  }
  return loadOrderedLabels(
    db,
    "org_profiles",
    "name",
    asIdList(announcement.student_profile_ids),
    "Student",
  );
}

async function loadOrderedLabels(
  db: ReturnType<typeof serviceClient>,
  table: "courses" | "classes" | "org_profiles",
  column: "title" | "name",
  ids: number[],
  fallback: string,
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from(table).select(`id, ${column}`).in("id", ids);
  if (error) throw error;
  const byId = new Map<number, string>();
  for (const row of data ?? []) {
    const record = row as { id: number } & Record<string, unknown>;
    const label = record[column];
    byId.set(record.id, typeof label === "string" && label.trim() ? label.trim() : fallback);
  }
  return ids.map((id) => byId.get(id) ?? fallback);
}

async function loadAffectedStudentIds(
  db: ReturnType<typeof serviceClient>,
  announcement: AnnouncementRow,
): Promise<number[]> {
  if (announcement.audience === "student") {
    return uniqueIds(asIdList(announcement.student_profile_ids));
  }
  if (announcement.audience === "course") {
    const courseIds = asIdList(announcement.course_ids);
    if (courseIds.length === 0) return [];
    const { data, error } = await db
      .from("enrollments")
      .select("student_profile_id")
      .eq("status", "active")
      .in("course_id", courseIds);
    if (error) throw error;
    return uniqueIds((data ?? []).map((row) => row.student_profile_id as number));
  }
  const classIds = asIdList(announcement.class_ids);
  if (classIds.length === 0) return [];
  const { data, error } = await db
    .from("class_members")
    .select("student_profile_id")
    .in("class_id", classIds);
  if (error) throw error;
  return uniqueIds((data ?? []).map((row) => row.student_profile_id as number));
}

async function loadRecipientEmails(
  db: ReturnType<typeof serviceClient>,
  organizationId: number,
  studentIds: number[],
): Promise<string[]> {
  if (studentIds.length === 0) return [];

  const { data, error } = await db
    .from("parent_student_links")
    .select(
      "parent:org_profiles!parent_student_links_parent_org_profile_id_fkey(user_id)",
    )
    .in("student_profile_id", studentIds);
  if (error) throw error;

  const { data: studentAccounts, error: studentError } = await db
    .from("org_profiles")
    .select("user_id")
    .in("id", studentIds)
    .not("user_id", "is", null);
  if (studentError) throw studentError;

  const parentUserIds = (data ?? []).flatMap((row) => {
    const parent = Array.isArray(row.parent) ? row.parent[0] : row.parent;
    return parent?.user_id ? [parent.user_id] : [];
  });
  const userIds = [
    ...new Set(
      [
        ...parentUserIds,
        ...(studentAccounts ?? []).map((row) => row.user_id),
      ].filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  if (userIds.length === 0) return [];

  const { data: memberships, error: membershipError } = await db
    .from("memberships")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("user_id", userIds);
  if (membershipError) throw membershipError;
  const active = new Set((memberships ?? []).map((row) => row.user_id as string));

  const activeIds = [...active];
  if (activeIds.length === 0) return [];
  const { data: accounts, error: accountError } = await db
    .from("profiles")
    .select("email")
    .in("id", activeIds);
  if (accountError) throw accountError;

  const emails = new Set<string>();
  for (const row of accounts ?? []) addEmail(emails, row.email);
  return [...emails];
}

function addEmail(emails: Set<string>, value: string | null | undefined) {
  const email = (value ?? "").trim().toLowerCase();
  if (email.includes("@")) emails.add(email);
}

async function loadProfile(
  db: ReturnType<typeof serviceClient>,
  id: string,
): Promise<ProfileRow | null> {
  const { data, error } = await db.from("profiles").select("id, email, name").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

function asIdList(value: number[] | null | undefined): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id) => typeof id === "number" && Number.isFinite(id));
}

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => typeof id === "number" && Number.isFinite(id)))];
}

function announcementTargetSummary(names: string[]): string {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return "Audience";
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  const remaining = cleaned.length - 2;
  const others = remaining === 1 ? "1 other" : `${remaining} others`;
  return `${cleaned[0]}, ${cleaned[1]} and ${others}`;
}

function announcementTargetList(names: string[]): string {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  if (cleaned.length === 0) return "Audience";
  if (cleaned.length === 1) return cleaned[0]!;
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(", ")}, and ${cleaned[cleaned.length - 1]}`;
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

function displayName(name: string, email: string): string {
  const trimmed = name.trim();
  return trimmed || email;
}

async function sendResendEvent(
  apiKey: string,
  email: string,
  payload: {
    announcement_title: string;
    announcement_body: string;
    organization_name: string;
    announcement_link: string;
    sender_full_name: string;
    audience_summary: string;
    audience_list: string;
  },
): Promise<void> {
  const response = await fetch(RESEND_EVENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: ANNOUNCEMENT_NOTIFICATION_EVENT,
      email,
      payload,
    }),
  });

  if (response.ok) return;

  const detail = await response.text().catch(() => "");
  console.error("Resend announcement-notification failed", response.status, detail);
  throw new Error("Couldn’t send the notification email.");
}
