import type { Json } from "@/infrastructure/supabase/database.types";
import { uploadOrgFileObject } from "@/infrastructure/supabase/storage";
import { safeFilename } from "@/materials/model/kind";
import {
  parseSubmissionFileTypes,
  type SubmissionFileType,
} from "@/submissions/model/fileTypes";
import { requireSupabase } from "./client";

export const submissionQueryKeys = {
  material: (materialId: number) => ["submissions", "material", materialId] as const,
  students: (courseId: number) => ["submissions", "students", courseId] as const,
};

export type SubmissionFileRecord = {
  id: number;
  filename: string;
  mimeType: string;
  storageRef: string;
  position: number;
};

export type SubmissionVersionRecord = {
  id: number;
  version: number;
  submittedAt: string;
  submittedBy: string;
  parentName: string;
  files: SubmissionFileRecord[];
};

export type MaterialSubmissionRecord = {
  id: number;
  studentProfileId: number;
  studentName: string;
  pointsEarned: number | null;
  pointsPossible: number | null;
  feedback: string;
  gradedAt: string | null;
  versions: SubmissionVersionRecord[];
};

export type EnrolledStudent = {
  id: number;
  name: string;
};

type FileEmbed = {
  id: number;
  filename: string;
  mime_type: string;
  storage_ref: string;
};

type SubmissionFileEmbed = {
  position: number;
  file: FileEmbed | FileEmbed[] | null;
};

type VersionEmbed = {
  id: number;
  version: number;
  submitted_at: string;
  submitted_by: string;
  submitter: { name: string } | { name: string }[] | null;
  files: SubmissionFileEmbed[] | null;
};

type SubmissionEmbed = {
  id: number;
  student_profile_id: number;
  points_earned: number | null;
  points_possible: number | null;
  feedback: string | null;
  graded_at: string | null;
  student: { id: number; name: string } | { id: number; name: string }[] | null;
  versions: VersionEmbed[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toSubmission(row: SubmissionEmbed): MaterialSubmissionRecord {
  const student = one(row.student);
  const versions = (row.versions ?? [])
    .map((version) => {
      const submitter = one(version.submitter);
      const files = (version.files ?? [])
        .flatMap((entry) => {
          const file = one(entry.file);
          if (!file) return [];
          return [
            {
              id: file.id,
              filename: file.filename,
              mimeType: file.mime_type,
              storageRef: file.storage_ref,
              position: entry.position,
            },
          ];
        })
        .sort((a, b) => a.position - b.position);
      return {
        id: version.id,
        version: version.version,
        submittedAt: version.submitted_at,
        submittedBy: version.submitted_by,
        parentName: submitter?.name ?? "",
        files,
      };
    })
    .sort((a, b) => a.version - b.version);

  return {
    id: row.id,
    studentProfileId: row.student_profile_id,
    studentName: student?.name ?? "",
    pointsEarned: row.points_earned,
    pointsPossible: row.points_possible,
    feedback: row.feedback ?? "",
    gradedAt: row.graded_at,
    versions,
  };
}

const SUBMISSION_EMBED = [
  "id",
  "student_profile_id",
  "points_earned",
  "points_possible",
  "feedback",
  "graded_at",
  "student:student_profiles!material_submissions_student_profile_id_fkey(id, name)",
  "versions:material_submission_versions(id, version, submitted_at, submitted_by, submitter:profiles!material_submission_versions_submitted_by_fkey(name), files:material_submission_files(position, file:files!material_submission_files_file_id_fkey(id, filename, mime_type, storage_ref)))",
].join(", ");

export async function gradeMaterialSubmission(args: {
  submissionId: number;
  points: number | null;
  feedback: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.rpc("grade_material_submission", {
    p_submission_id: args.submissionId,
    p_points: args.points,
    p_feedback: args.feedback,
  });
  if (error) throw new Error(error.message);
}

export async function listMaterialSubmissions(
  materialId: number,
): Promise<MaterialSubmissionRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("material_submissions")
    .select(SUBMISSION_EMBED)
    .eq("material_id", materialId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as SubmissionEmbed[]).map(toSubmission);
}

export async function listActiveEnrolledStudents(
  courseId: number,
): Promise<EnrolledStudent[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("enrollments")
    .select(
      "student_profile_id, student:student_profiles!enrollments_student_profile_id_fkey(id, name)",
    )
    .eq("course_id", courseId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const student = one(
      row.student as { id: number; name: string } | { id: number; name: string }[] | null,
    );
    if (!student) return [];
    return [{ id: student.id, name: student.name }];
  });
}

type BeginFile = { fileId: number; storageRef: string };

export async function turnInFiles(args: {
  materialId: number;
  studentProfileId: number;
  files: File[];
  allowed: readonly SubmissionFileType[];
}): Promise<void> {
  const db = requireSupabase();
  const payload = args.files.map((file) => ({
    filename: safeFilename(file.name),
    mime: file.type || "application/octet-stream",
    size: file.size,
  }));

  const { data, error } = await db.rpc("begin_material_submission", {
    p_material_id: args.materialId,
    p_student_profile_id: args.studentProfileId,
    p_files: payload as unknown as Json,
  });
  if (error) throw new Error(error.message);

  const reserved = parseBeginFiles(data);
  if (reserved.length !== args.files.length) {
    throw new Error("That upload didn’t finish. Try turning it in again.");
  }

  try {
    for (let index = 0; index < args.files.length; index += 1) {
      const reservedFile = reserved[index];
      const file = args.files[index];
      if (!reservedFile || !file) {
        throw new Error("That upload didn’t finish. Try turning it in again.");
      }
      await uploadOrgFileObject(reservedFile.storageRef, file);
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "That file didn’t upload.";
    throw new Error(message);
  }

  const { error: finishError } = await db.rpc("finish_material_submission", {
    p_material_id: args.materialId,
    p_student_profile_id: args.studentProfileId,
    p_file_ids: reserved.map((file) => file.fileId),
  });
  if (finishError) throw new Error(finishError.message);
}

function parseBeginFiles(data: Json): BeginFile[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const files = data.files;
  if (!Array.isArray(files)) return [];
  return files.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const fileId = entry.fileId;
    const storageRef = entry.storageRef;
    if (typeof fileId !== "number" || typeof storageRef !== "string") return [];
    return [{ fileId, storageRef }];
  });
}

export function readSubmissionFileTypes(values: readonly string[]): SubmissionFileType[] {
  return parseSubmissionFileTypes(values);
}
