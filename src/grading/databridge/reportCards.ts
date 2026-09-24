import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";

export const reportCardQueryKeys = {
  student: (studentId: number) => ["report-cards", "student", studentId] as const,
  course: (courseId: number) => ["report-cards", "course", courseId] as const,
  detail: (cardId: number) => ["report-cards", "detail", cardId] as const,
  mine: (organizationId: number) => ["report-cards", "mine", organizationId] as const,
};

export type ReportCardStatus = "draft" | "submitted" | "sent";

export type ReportCardItem = {
  key: string;
  quizId: number | null;
  title: string;
  locked: boolean;
  earned: number | null;
  possible: number | null;
  percent: number | null;
  label: string | null;
};

export type ReportCardSnapshot = {
  scaleMode: string;
  courseId: number | null;
  courseTitle: string;
  studentName: string;
  finalPercent: number | null;
  finalLabel: string | null;
  overrideLabel: string | null;
  overrideNote: string | null;
  items: ReportCardItem[];
};

export type ReportCardRecord = {
  id: number;
  organizationId: number;
  studentProfileId: number;
  courseId: number;
  enrollmentId: number;
  status: ReportCardStatus;
  narrative: string;
  snapshot: ReportCardSnapshot;
  submittedAt: string | null;
  sentAt: string | null;
};

export type ReportCardDelivery = {
  id: number;
  recipientKind: "student" | "parent";
  recipientEmail: string | null;
  channel: "email" | "in_app";
  status: "queued" | "sent" | "failed";
  attemptCount: number;
  lastError: string | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseStatus(value: string): ReportCardStatus {
  if (value === "submitted" || value === "sent" || value === "draft") return value;
  return "draft";
}

export function parseSnapshot(value: Json): ReportCardSnapshot {
  const empty: ReportCardSnapshot = {
    scaleMode: "none",
    courseId: null,
    courseTitle: "Course",
    studentName: "Student",
    finalPercent: null,
    finalLabel: null,
    overrideLabel: null,
    overrideNote: null,
    items: [],
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const quizId = asNumber(item.quiz_id);
        const materialId = asNumber(item.material_id);
        if (quizId == null && materialId == null) return [];
        return [
          {
            key: quizId != null ? `quiz-${quizId}` : `material-${materialId}`,
            quizId,
            title: typeof item.title === "string" ? item.title : quizId != null ? "Quiz" : "Material",
            locked: item.locked === true,
            earned: asNumber(item.earned),
            possible: asNumber(item.possible),
            percent: asNumber(item.percent),
            label: typeof item.label === "string" ? item.label : null,
          },
        ];
      })
    : [];
  return {
    scaleMode: typeof value.scale_mode === "string" ? value.scale_mode : "none",
    courseId: asNumber(value.course_id),
    courseTitle: typeof value.course_title === "string" ? value.course_title : "Course",
    studentName: typeof value.student_name === "string" ? value.student_name : "Student",
    finalPercent: asNumber(value.final_percent),
    finalLabel: typeof value.final_label === "string" ? value.final_label : null,
    overrideLabel: typeof value.override_label === "string" ? value.override_label : null,
    overrideNote: typeof value.override_note === "string" ? value.override_note : null,
    items,
  };
}

type CardRow = {
  id: number;
  organization_id: number;
  student_profile_id: number;
  course_id: number;
  enrollment_id: number;
  status: string;
  narrative: string;
  snapshot: Json;
  submitted_at: string | null;
  sent_at: string | null;
};

function toCard(row: CardRow): ReportCardRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    studentProfileId: row.student_profile_id,
    courseId: row.course_id,
    enrollmentId: row.enrollment_id,
    status: parseStatus(row.status),
    narrative: row.narrative,
    snapshot: parseSnapshot(row.snapshot),
    submittedAt: row.submitted_at,
    sentAt: row.sent_at,
  };
}

const CARD_COLUMNS =
  "id, organization_id, student_profile_id, course_id, enrollment_id, status, narrative, snapshot, submitted_at, sent_at";

export async function listStudentReportCards(
  studentProfileId: number,
): Promise<ReportCardRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_instances")
    .select(CARD_COLUMNS)
    .eq("student_profile_id", studentProfileId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toCard(row));
}

export async function listCourseReportCards(courseId: number): Promise<ReportCardRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_instances")
    .select(CARD_COLUMNS)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toCard(row));
}

export async function listSentReportCardsForMe(
  organizationId: number,
): Promise<ReportCardRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_instances")
    .select(CARD_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("status", "sent")
    .order("sent_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toCard(row));
}

export async function getReportCard(id: number): Promise<ReportCardRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_instances")
    .select(CARD_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCard(data) : null;
}

export async function listReportCardDeliveries(
  cardId: number,
): Promise<ReportCardDelivery[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("report_card_deliveries")
    .select(
      "id, recipient_kind, recipient_email, channel, status, attempt_count, last_error",
    )
    .eq("report_card_instance_id", cardId)
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    if (row.recipient_kind !== "student" && row.recipient_kind !== "parent") return [];
    if (row.channel !== "email" && row.channel !== "in_app") return [];
    if (row.status !== "queued" && row.status !== "sent" && row.status !== "failed") return [];
    return [
      {
        id: row.id,
        recipientKind: row.recipient_kind,
        recipientEmail: row.recipient_email,
        channel: row.channel,
        status: row.status,
        attemptCount: row.attempt_count,
        lastError: row.last_error,
      },
    ];
  });
}

function asIds(value: Json): number[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const id = asNumber(item);
    return id == null ? [] : [id];
  });
}

export async function generateStudentReportCards(studentProfileId: number): Promise<number[]> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("generate_student_report_cards", {
    p_student_profile_id: studentProfileId,
  });
  if (error) throw new Error(error.message);
  return asIds(data);
}

export async function generateCourseReportCards(courseId: number): Promise<number[]> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("generate_course_report_cards", {
    p_course_id: courseId,
  });
  if (error) throw new Error(error.message);
  return asIds(data);
}

export async function refreshReportCard(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("refresh_report_card", { p_id: id });
  if (error) throw new Error(error.message);
}

export async function saveReportCardNarrative(id: number, narrative: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("report_card_instances")
    .update({ narrative })
    .eq("id", id)
    .eq("status", "draft");
  if (error) throw new Error(error.message);
}

export async function submitReportCard(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("submit_report_card", { p_id: id });
  if (error) throw new Error(error.message);
}

export async function resendReportCardDelivery(deliveryId: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("resend_report_card_delivery", {
    p_delivery_id: deliveryId,
  });
  if (error) throw new Error(error.message);
}

/** Fire-and-forget mail. Submit already succeeded if this fails. */
export async function sendReportCardEmail(instanceId: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.functions.invoke("send-report-card", {
    body: { instanceId },
  });
  if (error) throw new Error(error.message);
}
