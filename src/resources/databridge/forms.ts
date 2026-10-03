import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import {
  parseFormSchema,
  type FormAnswerValue,
  type OrgFormSchema,
} from "@/resources/model/formSchema";

export type OrgFormRecord = {
  id: number;
  organizationId: number;
  itemId: number;
  schema: OrgFormSchema;
  status: "draft" | "published";
  updatedAt: string;
};

export type FormSubjectStudent = {
  id: number;
  name: string;
};

export type OrgFormSubmissionRecord = {
  id: number;
  formId: number;
  submittedBy: string;
  submitterName: string;
  subjectStudentProfileId: number | null;
  subjectStudentName: string;
  payload: Record<string, unknown>;
  submittedAt: string;
};

const FORM_SELECT = "id, organization_id, item_id, schema_json, status, updated_at" as const;

const SUBMISSION_SELECT =
  "id, form_id, submitted_by, subject_student_profile_id, payload_json, submitted_at, submitter:profiles!org_form_submissions_submitted_by_fkey(name), student:org_profiles!org_form_submissions_subject_student_profile_id_fkey(name)" as const;

function embeddedName(
  value: { name: string | null } | { name: string | null }[] | null,
): string {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.name?.trim() ?? "";
}

function toForm(row: {
  id: number;
  organization_id: number;
  item_id: number;
  schema_json: Json;
  status: string;
  updated_at: string;
}): OrgFormRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    itemId: row.item_id,
    schema: parseFormSchema(row.schema_json),
    status: row.status === "published" ? "published" : "draft",
    updatedAt: row.updated_at,
  };
}

export const orgFormQueryKeys = {
  byItem: (itemId: number) => ["org-forms", "item", itemId] as const,
  submissions: (formId: number) => ["org-forms", "submissions", formId] as const,
  students: (organizationId: number) => ["org-forms", "students", organizationId] as const,
};

export async function getOrgFormByItemId(itemId: number): Promise<OrgFormRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_forms")
    .select(FORM_SELECT)
    .eq("item_id", itemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toForm(data) : null;
}

export async function saveOrgFormSchema(
  formId: number,
  schema: OrgFormSchema,
): Promise<OrgFormRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_forms")
    .update({ schema_json: schema as unknown as Json })
    .eq("id", formId)
    .select(FORM_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Those questions couldn’t be saved.");
  return toForm(data);
}

export async function listFormSubjectStudents(
  organizationId: number,
): Promise<FormSubjectStudent[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("counts_as_student", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
}

export async function submitOrgForm(args: {
  organizationId: number;
  formId: number;
  submittedBy: string;
  subjectStudentProfileId: number | null;
  payload: Record<string, FormAnswerValue>;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("org_form_submissions").insert({
    organization_id: args.organizationId,
    form_id: args.formId,
    submitted_by: args.submittedBy,
    subject_student_profile_id: args.subjectStudentProfileId,
    payload_json: args.payload as unknown as Json,
  });
  if (error) throw new Error(error.message);
}

export async function listOrgFormSubmissions(
  formId: number,
): Promise<OrgFormSubmissionRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_form_submissions")
    .select(SUBMISSION_SELECT)
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    submittedBy: row.submitted_by,
    submitterName: embeddedName(row.submitter),
    subjectStudentProfileId: row.subject_student_profile_id,
    subjectStudentName: embeddedName(row.student),
    payload:
      row.payload_json && typeof row.payload_json === "object" && !Array.isArray(row.payload_json)
        ? (row.payload_json as Record<string, unknown>)
        : {},
    submittedAt: row.submitted_at,
  }));
}
