import { requireSupabase } from "./client";
import {
  parseAnnouncementAudience,
  type AnnouncementAudience,
} from "@/announcements/model/audience";
import type { AnnouncementDraft } from "@/announcements/model/validate";

export type AnnouncementRecord = {
  id: number;
  organizationId: number;
  audience: AnnouncementAudience;
  courseId: number | null;
  classId: number | null;
  studentId: number | null;
  title: string;
  body: string;
  startDate: string | null;
  endDate: string | null;
  deletedAt: string | null;
  courseTitle: string | null;
  classTitle: string | null;
  studentName: string | null;
  read: boolean;
};

const ANNOUNCEMENT_COLUMNS =
  "id, organization_id, audience, course_id, class_id, student_profile_id, title, body, start_date, end_date, deleted_at";

const ANNOUNCEMENT_EMBED =
  `${ANNOUNCEMENT_COLUMNS}, course:courses!announcements_course_id_fkey(title), class_group:classes!announcements_class_id_fkey(title), student:student_profiles!announcements_student_profile_id_fkey(name), announcement_reads(user_id)`;

type NamedEmbed = { title?: string; name?: string } | null;

type AnnouncementRow = {
  id: number;
  organization_id: number;
  audience: string;
  course_id: number | null;
  class_id: number | null;
  student_profile_id: number | null;
  title: string;
  body: string;
  start_date: string | null;
  end_date: string | null;
  deleted_at: string | null;
  course?: NamedEmbed | NamedEmbed[];
  class_group?: NamedEmbed | NamedEmbed[];
  student?: NamedEmbed | NamedEmbed[];
  announcement_reads?: Array<{ user_id: string }> | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toAnnouncement(row: AnnouncementRow, userId?: string): AnnouncementRecord | null {
  const audience = parseAnnouncementAudience(row.audience);
  if (!audience) return null;
  const reads = Array.isArray(row.announcement_reads) ? row.announcement_reads : [];
  const read = userId
    ? reads.some((entry) => entry.user_id === userId)
    : reads.length > 0;
  return {
    id: row.id,
    organizationId: row.organization_id,
    audience,
    courseId: row.course_id,
    classId: row.class_id,
    studentId: row.student_profile_id,
    title: row.title,
    body: row.body,
    startDate: row.start_date,
    endDate: row.end_date,
    deletedAt: row.deleted_at,
    courseTitle: one(row.course)?.title ?? null,
    classTitle: one(row.class_group)?.title ?? null,
    studentName: one(row.student)?.name ?? null,
    read,
  };
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
  return (data ?? []).flatMap((row) => {
    const mapped = toAnnouncement(row, userId);
    return mapped ? [mapped] : [];
  });
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
  return toAnnouncement(data, userId);
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
    course_id: audience === "course" ? args.draft.courseId : null,
    class_id: audience === "class" ? args.draft.classId : null,
    student_profile_id: audience === "student" ? args.draft.studentId : null,
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
  const mapped = toAnnouncement(data, args.createdBy);
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
      course_id: audience === "course" ? draft.courseId : null,
      class_id: audience === "class" ? draft.classId : null,
      student_profile_id: audience === "student" ? draft.studentId : null,
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
