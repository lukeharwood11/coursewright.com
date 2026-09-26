import { requireSupabase } from "./client";
import { orgContactsByUserId } from "@/organizations/databridge/orgNames";
import {
  parseAnnouncementAudience,
  type AnnouncementAudience,
} from "@/announcements/model/audience";
import type { AnnouncementDraft } from "@/announcements/model/validate";

export type AnnouncementRecord = {
  id: number;
  organizationId: number;
  audience: AnnouncementAudience;
  courseIds: number[];
  classIds: number[];
  studentIds: number[];
  title: string;
  body: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  authorName: string;
  deletedAt: string | null;
  courseTitles: string[];
  classTitles: string[];
  studentNames: string[];
  read: boolean;
};

const ANNOUNCEMENT_COLUMNS =
  "id, organization_id, audience, course_ids, class_ids, student_profile_ids, title, body, start_date, end_date, created_at, deleted_at, created_by";

const ANNOUNCEMENT_EMBED = `${ANNOUNCEMENT_COLUMNS}, author:profiles!announcements_created_by_fkey(name), announcement_reads(user_id)`;

type AnnouncementRow = {
  id: number;
  organization_id: number;
  audience: string;
  course_ids: number[] | null;
  class_ids: number[] | null;
  student_profile_ids: number[] | null;
  title: string;
  body: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by: string;
  deleted_at: string | null;
  author?: { name: string } | { name: string }[] | null;
  announcement_reads?: Array<{ user_id: string }> | null;
};

function asIdList(value: number[] | null | undefined): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id) => typeof id === "number" && Number.isFinite(id));
}

async function resolveTargetLabels(args: {
  audience: AnnouncementAudience;
  courseIds: number[];
  classIds: number[];
  studentIds: number[];
}): Promise<{
  courseTitles: string[];
  classTitles: string[];
  studentNames: string[];
}> {
  const db = requireSupabase();
  const empty = { courseTitles: [] as string[], classTitles: [] as string[], studentNames: [] as string[] };

  if (args.audience === "course" && args.courseIds.length > 0) {
    const { data, error } = await db
      .from("courses")
      .select("id, title")
      .in("id", args.courseIds);
    if (error) throw new Error(error.message);
    const byId = new Map((data ?? []).map((row) => [row.id, row.title]));
    return {
      ...empty,
      courseTitles: args.courseIds.map((id) => byId.get(id) ?? "Course"),
    };
  }

  if (args.audience === "class" && args.classIds.length > 0) {
    const { data, error } = await db
      .from("classes")
      .select("id, title")
      .in("id", args.classIds);
    if (error) throw new Error(error.message);
    const byId = new Map((data ?? []).map((row) => [row.id, row.title]));
    return {
      ...empty,
      classTitles: args.classIds.map((id) => byId.get(id) ?? "Class"),
    };
  }

  if (args.audience === "student" && args.studentIds.length > 0) {
    const { data, error } = await db
      .from("org_profiles")
      .select("id, name")
      .in("id", args.studentIds);
    if (error) throw new Error(error.message);
    const byId = new Map((data ?? []).map((row) => [row.id, row.name]));
    return {
      ...empty,
      studentNames: args.studentIds.map((id) => byId.get(id) ?? "Student"),
    };
  }

  return empty;
}

async function toAnnouncement(
  row: AnnouncementRow,
  userId?: string,
): Promise<AnnouncementRecord | null> {
  const audience = parseAnnouncementAudience(row.audience);
  if (!audience) return null;
  const courseIds = asIdList(row.course_ids);
  const classIds = asIdList(row.class_ids);
  const studentIds = asIdList(row.student_profile_ids);
  const labels = await resolveTargetLabels({
    audience,
    courseIds,
    classIds,
    studentIds,
  });
  const reads = Array.isArray(row.announcement_reads) ? row.announcement_reads : [];
  const read = userId
    ? reads.some((entry) => entry.user_id === userId)
    : reads.length > 0;
  const contacts = await orgContactsByUserId(row.organization_id, [row.created_by]);
  return {
    id: row.id,
    organizationId: row.organization_id,
    audience,
    courseIds,
    classIds,
    studentIds,
    title: row.title,
    body: row.body,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    authorName: contacts.get(row.created_by)?.name ?? "Teacher",
    deletedAt: row.deleted_at,
    courseTitles: labels.courseTitles,
    classTitles: labels.classTitles,
    studentNames: labels.studentNames,
    read,
  };
}

async function mapRows(
  rows: AnnouncementRow[],
  userId?: string,
): Promise<AnnouncementRecord[]> {
  const mapped = await Promise.all(rows.map((row) => toAnnouncement(row, userId)));
  return mapped.flatMap((row) => (row ? [row] : []));
}

export const announcementQueryKeys = {
  org: (organizationId: number) => ["announcements", "org", organizationId] as const,
  detail: (id: number) => ["announcements", "detail", id] as const,
};

export async function listAnnouncementsForOrganization(
  organizationId: number,
  userId?: string,
): Promise<AnnouncementRecord[]> {
  const db = requireSupabase();
  let query = db
    .from("announcements")
    .select(ANNOUNCEMENT_EMBED)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (userId) {
    query = query.eq("announcement_reads.user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return mapRows((data ?? []) as AnnouncementRow[], userId);
}

export async function getAnnouncement(
  id: number,
  userId?: string,
): Promise<AnnouncementRecord | null> {
  const db = requireSupabase();
  let query = db
    .from("announcements")
    .select(ANNOUNCEMENT_EMBED)
    .eq("id", id);

  if (userId) {
    query = query.eq("announcement_reads.user_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toAnnouncement(data as AnnouncementRow, userId);
}

function insertPayload(args: {
  organizationId: number;
  createdBy: string;
  draft: AnnouncementDraft;
}) {
  const audience = args.draft.audience;
  if (!audience) {
    throw new Error("Choose who this announcement is for.");
  }
  return {
    organization_id: args.organizationId,
    audience,
    course_ids: audience === "course" ? args.draft.courseIds : [],
    class_ids: audience === "class" ? args.draft.classIds : [],
    student_profile_ids: audience === "student" ? args.draft.studentIds : [],
    title: args.draft.title.trim(),
    body: args.draft.body.trim(),
    start_date: args.draft.startDate || null,
    end_date: args.draft.endDate || null,
    created_by: args.createdBy,
  };
}

export async function createAnnouncement(args: {
  organizationId: number;
  createdBy: string;
  draft: AnnouncementDraft;
}): Promise<AnnouncementRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("announcements")
    .insert(insertPayload(args))
    .select(ANNOUNCEMENT_EMBED)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("The announcement was created but couldn’t be opened yet.");
  const mapped = await toAnnouncement(data as AnnouncementRow, args.createdBy);
  if (!mapped) throw new Error("The announcement was created but couldn’t be opened yet.");
  return mapped;
}

export async function updateAnnouncement(
  id: number,
  draft: AnnouncementDraft,
): Promise<void> {
  const db = requireSupabase();
  const audience = draft.audience;
  if (!audience) throw new Error("Choose who this announcement is for.");
  const { error } = await db
    .from("announcements")
    .update({
      audience,
      course_ids: audience === "course" ? draft.courseIds : [],
      class_ids: audience === "class" ? draft.classIds : [],
      student_profile_ids: audience === "student" ? draft.studentIds : [],
      title: draft.title.trim(),
      body: draft.body.trim(),
      start_date: draft.startDate || null,
      end_date: draft.endDate || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteAnnouncement(
  id: number,
  deletedBy: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("announcements")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAnnouncementRead(
  announcementId: number,
  userId: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("announcement_reads").upsert(
    {
      announcement_id: announcementId,
      user_id: userId,
    },
    { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}

export async function listCourseIdsTaughtBy(userId: string): Promise<number[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_instructors")
    .select("course_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.course_id);
}

export type AnnouncementEmailStatus = {
  sent: number;
  failed: number;
  error: string | null;
};

export async function sendAnnouncementNotification(
  announcementId: number,
): Promise<AnnouncementEmailStatus> {
  const db = requireSupabase();
  const { data, error } = await db.functions.invoke("send-announcement-notification", {
    body: { announcementId },
  });
  const fromBody = await readFunctionErrorBody(data, error);
  if (error || fromBody) {
    return {
      sent: 0,
      failed: 0,
      error: fromBody ?? functionErrorMessage(error, "Couldn’t send the notification email."),
    };
  }
  const counts = emailCounts(data);
  if (counts.failed > 0 && counts.sent === 0) {
    return {
      ...counts,
      error: "Couldn’t send the notification email.",
    };
  }
  if (counts.failed > 0) {
    return {
      ...counts,
      error: `Emailed ${counts.sent} ${counts.sent === 1 ? "student" : "students"}; some emails didn’t go through.`,
    };
  }
  return { ...counts, error: null };
}

function emailCounts(value: unknown): { sent: number; failed: number } {
  if (!value || typeof value !== "object") return { sent: 0, failed: 0 };
  const record = value as { sent?: unknown; failed?: unknown };
  return {
    sent: typeof record.sent === "number" ? record.sent : 0,
    failed: typeof record.failed === "number" ? record.failed : 0,
  };
}

async function readFunctionErrorBody(
  data: unknown,
  error: { message: string; context?: unknown } | null,
): Promise<string | null> {
  const fromData = errorString(data);
  if (fromData) return fromData;

  const context = error?.context;
  if (context instanceof Response) {
    try {
      const body: unknown = await context.clone().json();
      return errorString(body);
    } catch {
      return null;
    }
  }
  return errorString(context);
}

function errorString(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  ) {
    return (value as { error: string }).error;
  }
  return null;
}

function functionErrorMessage(
  error: { message: string } | null,
  fallback: string,
): string {
  const message = error?.message.trim() ?? "";
  if (!message || message.toLowerCase() === "edge function returned a non-2xx status code") {
    return fallback;
  }
  return message;
}
