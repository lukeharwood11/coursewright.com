import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import { nextPosition } from "@/units/model/order";
import { ensureResourcesUnit } from "@/units/databridge/units";
import { getResourceFolder } from "@/resources/databridge/folders";
import { getResourceItem } from "@/resources/databridge/items";
import { parseMaterialKind, type MaterialKind } from "@/materials/model/kind";
import {
  parseMaterialWorkType,
  type MaterialWorkType,
} from "@/materials/model/workType";
import type { CreateMaterialInput } from "@/materials/model/validate";
import {
  parseMaterialVisibility,
  type MaterialVisibility,
} from "@/materials/model/visibility";

export type MaterialRecord = {
  id: number;
  organizationId: number;
  courseId: number;
  unitId: number | null;
  title: string;
  description: string;
  kind: MaterialKind;
  workType: MaterialWorkType;
  url: string | null;
  fileId: number | null;
  resourceFolderId: number | null;
  resourceItemId: number | null;
  scheduledDate: string | null;
  dueDate: string | null;
  dueAt: string | null;
  dueTimezone: string | null;
  acceptSubmissions: boolean;
  allowSubmissionsPastDue: boolean;
  gradable: boolean;
  pointsPossible: number | null;
  submissionLimit: number;
  submissionFileTypes: string[];
  position: number;
  currentVersion: number;
  visibility: MaterialVisibility;
  deletedAt: string | null;
};

export const materialQueryKeys = {
  list: (courseId: number) => ["materials", "list", courseId] as const,
  unit: (unitId: number) => ["materials", "unit", unitId] as const,
  detail: (id: number) => ["materials", "detail", id] as const,
  versions: (id: number) => ["materials", "versions", id] as const,
  blocks: (id: number) => ["materials", "blocks", id] as const,
};

const MATERIAL_COLUMNS =
  "id, organization_id, course_id, unit_id, title, description, kind, work_type, url, file_id, resource_folder_id, resource_item_id, scheduled_date, due_date, due_at, due_timezone, accept_submissions, allow_submissions_past_due, gradable, points_possible, submission_limit, submission_file_types, position, current_version, visibility, deleted_at";

type MaterialRow = {
  id: number;
  organization_id: number;
  course_id: number | null;
  unit_id: number | null;
  title: string;
  description: string;
  kind: string;
  work_type: string;
  url: string | null;
  file_id: number | null;
  resource_folder_id: number | null;
  resource_item_id: number | null;
  scheduled_date: string | null;
  due_date: string | null;
  due_at: string | null;
  due_timezone: string | null;
  accept_submissions: boolean;
  allow_submissions_past_due: boolean;
  gradable: boolean;
  points_possible: number | null;
  submission_limit: number;
  submission_file_types: string[];
  position: number;
  current_version: number;
  visibility: string;
  deleted_at: string | null;
};

function toMaterial(row: MaterialRow): MaterialRecord | null {
  const kind = parseMaterialKind(row.kind);
  const workType = parseMaterialWorkType(row.work_type);
  if (!kind || !workType || row.course_id == null) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    unitId: row.unit_id,
    title: row.title,
    description: row.description,
    kind,
    workType,
    url: row.url,
    fileId: row.file_id,
    resourceFolderId: row.resource_folder_id,
    resourceItemId: row.resource_item_id,
    scheduledDate: row.scheduled_date,
    dueDate: row.due_date,
    dueAt: row.due_at,
    dueTimezone: row.due_timezone,
    acceptSubmissions: row.accept_submissions,
    allowSubmissionsPastDue: row.allow_submissions_past_due,
    gradable: row.gradable,
    pointsPossible: row.points_possible,
    submissionLimit: row.submission_limit,
    submissionFileTypes: row.submission_file_types ?? [],
    position: row.position,
    currentVersion: row.current_version,
    visibility: parseMaterialVisibility(row.visibility),
    deletedAt: row.deleted_at,
  };
}

export async function listMaterialsForCourse(
  courseId: number,
): Promise<MaterialRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .select(MATERIAL_COLUMNS)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("position")
    .order("id");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const material = toMaterial(row);
    return material ? [material] : [];
  });
}

export async function listMaterialsForUnit(unitId: number): Promise<MaterialRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .select(MATERIAL_COLUMNS)
    .eq("unit_id", unitId)
    .is("deleted_at", null)
    .order("position")
    .order("id");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const material = toMaterial(row);
    return material ? [material] : [];
  });
}

export async function getMaterial(id: number): Promise<MaterialRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .select(MATERIAL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toMaterial(data);
}

export async function createMaterial(args: {
  organizationId: number;
  courseId: number;
  unitId: number | null;
  input: CreateMaterialInput;
  fileId?: number | null;
  dueAt?: string | null;
  dueTimezone?: string | null;
}): Promise<MaterialRecord> {
  const siblings = args.unitId
    ? await listMaterialsForUnit(args.unitId)
    : (await listMaterialsForCourse(args.courseId)).filter((row) => row.unitId == null);

  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      unit_id: args.unitId,
      title: args.input.title,
      description: args.input.description,
      kind: args.input.kind,
      work_type: args.input.workType,
      url: args.input.url,
      file_id: args.fileId ?? null,
      scheduled_date: args.input.scheduledDate,
      due_date: args.input.workType === "assignment" ? args.input.dueDate : null,
      due_at: args.input.workType === "assignment" ? (args.dueAt ?? null) : null,
      due_timezone:
        args.input.workType === "assignment" ? (args.dueTimezone ?? null) : null,
      position: nextPosition(siblings.map((row) => row.position)),
    })
    .select(MATERIAL_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const material = data ? toMaterial(data) : null;
  if (!material) throw new Error("The material was created but couldn’t be opened yet.");
  return material;
}


function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    (error.message ?? "").toLowerCase().includes("duplicate")
  );
}

/** Link one org folder or item as a material on the course Resources unit. */
export async function createResourceMaterial(args: {
  organizationId: number;
  courseId: number;
  folderId?: number | null;
  itemId?: number | null;
}): Promise<MaterialRecord> {
  const folderId = args.folderId ?? null;
  const itemId = args.itemId ?? null;
  if ((folderId == null) === (itemId == null)) {
    throw new Error("Choose a folder or a resource.");
  }

  const unit = await ensureResourcesUnit(args.organizationId, args.courseId);

  let title = "Resource";
  if (folderId != null) {
    const folder = await getResourceFolder(folderId);
    if (!folder || folder.archivedAt || folder.organizationId !== args.organizationId) {
      throw new Error("That folder isn’t available.");
    }
    title = folder.name;
  } else if (itemId != null) {
    const item = await getResourceItem(itemId);
    if (!item || item.archivedAt || item.organizationId !== args.organizationId) {
      throw new Error("That resource isn’t available.");
    }
    title = item.title;
  }

  const siblings = await listMaterialsForUnit(unit.id);
  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      unit_id: unit.id,
      title,
      description: "",
      kind: "resource",
      work_type: "material",
      resource_folder_id: folderId,
      resource_item_id: itemId,
      position: nextPosition(siblings.map((row) => row.position)),
    })
    .select(MATERIAL_COLUMNS)
    .maybeSingle();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error("That resource is already on this course.");
    }
    throw new Error(error.message);
  }
  const material = data ? toMaterial(data) : null;
  if (!material) throw new Error("The resource was linked but couldn’t be opened yet.");
  return material;
}

export async function updateMaterial(
  id: number,
  patch: {
    title?: string;
    description?: string;
    url?: string | null;
    workType?: MaterialWorkType;
    fileId?: number | null;
    scheduledDate?: string | null;
    dueDate?: string | null;
    dueAt?: string | null;
    dueTimezone?: string | null;
    acceptSubmissions?: boolean;
    allowSubmissionsPastDue?: boolean;
    gradable?: boolean;
    pointsPossible?: number | null;
    submissionLimit?: number;
    submissionFileTypes?: string[];
    position?: number;
    visibility?: MaterialVisibility;
    deletedAt?: string | null;
    deletedBy?: string | null;
  },
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("materials")
    .update({
      title: patch.title,
      description: patch.description,
      url: patch.url,
      work_type: patch.workType,
      file_id: patch.fileId,
      scheduled_date: patch.scheduledDate,
      due_date: patch.dueDate,
      due_at: patch.dueAt,
      due_timezone: patch.dueTimezone,
      accept_submissions: patch.acceptSubmissions,
      allow_submissions_past_due: patch.allowSubmissionsPastDue,
      gradable: patch.gradable,
      points_possible: patch.pointsPossible,
      submission_limit: patch.submissionLimit,
      submission_file_types: patch.submissionFileTypes,
      position: patch.position,
      visibility: patch.visibility,
      deleted_at: patch.deletedAt,
      deleted_by: patch.deletedBy,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteMaterial(id: number, userId: string): Promise<void> {
  await updateMaterial(id, {
    deletedAt: new Date().toISOString(),
    deletedBy: userId,
  });
}

export async function restoreMaterial(id: number): Promise<void> {
  await updateMaterial(id, { deletedAt: null, deletedBy: null });
}

export type MaterialVersionRecord = {
  version: number;
  changedAt: string;
  changeType: string;
  changedByName: string | null;
  snapshot: unknown;
};

function versionChangerName(
  value: { name: string | null } | { name: string | null }[] | null,
): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  const name = row?.name?.trim();
  return name ? name : null;
}

export async function listMaterialVersions(
  materialId: number,
): Promise<MaterialVersionRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("material_versions")
    .select(
      "version, changed_at, change_type, snapshot, changer:profiles!material_versions_changed_by_fkey(name)",
    )
    .eq("material_id", materialId)
    .order("version", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    version: row.version,
    changedAt: row.changed_at,
    changeType: row.change_type,
    changedByName: versionChangerName(row.changer),
    snapshot: row.snapshot,
  }));
}

type SnapshotBlock = {
  kind: string;
  body: unknown;
  position: number;
  file_id: number | null;
};

function snapshotBlocks(snapshot: unknown): SnapshotBlock[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const blocks = (snapshot as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.kind !== "string") return [];
    return [
      {
        kind: row.kind,
        body: row.body ?? {},
        position: typeof row.position === "number" ? row.position : 0,
        file_id: typeof row.file_id === "number" ? row.file_id : null,
      },
    ];
  });
}

function workTypeFromSnapshot(material: Record<string, unknown>): MaterialWorkType {
  const parsed =
    typeof material.work_type === "string"
      ? parseMaterialWorkType(material.work_type)
      : null;
  if (parsed) return parsed;
  if (
    typeof material.due_date === "string" ||
    material.accept_submissions === true ||
    material.gradable === true
  ) {
    return "assignment";
  }
  return "material";
}

function snapshotMaterial(snapshot: unknown): Record<string, unknown> | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const material = (snapshot as { material?: unknown }).material;
  if (!material || typeof material !== "object") return null;
  return material as Record<string, unknown>;
}

export async function revertMaterialToVersion(
  materialId: number,
  snapshot: unknown,
): Promise<void> {
  const material = snapshotMaterial(snapshot);
  if (!material) throw new Error("That version doesn’t have a snapshot we can restore.");

  const workType = workTypeFromSnapshot(material);
  const assignment = workType === "assignment";

  const db = requireSupabase();
  const { error: updateError } = await db
    .from("materials")
    .update({
      title: typeof material.title === "string" ? material.title : undefined,
      description:
        typeof material.description === "string" ? material.description : undefined,
      url: typeof material.url === "string" ? material.url : null,
      work_type: workType,
      file_id: typeof material.file_id === "number" ? material.file_id : null,
      scheduled_date:
        typeof material.scheduled_date === "string" ? material.scheduled_date : null,
      due_date:
        assignment && typeof material.due_date === "string" ? material.due_date : null,
      due_at:
        !assignment || material.due_date == null
          ? null
          : typeof material.due_at === "string"
            ? material.due_at
            : null,
      due_timezone:
        !assignment || material.due_date == null
          ? null
          : typeof material.due_timezone === "string"
            ? material.due_timezone
            : null,
      accept_submissions: assignment && material.accept_submissions === true,
      allow_submissions_past_due:
        typeof material.allow_submissions_past_due === "boolean"
          ? material.allow_submissions_past_due
          : undefined,
      gradable: assignment && material.gradable === true,
      points_possible:
        assignment &&
        material.gradable === true &&
        typeof material.points_possible === "number"
          ? material.points_possible
          : null,
      submission_limit:
        typeof material.submission_limit === "number" ? material.submission_limit : undefined,
      submission_file_types: Array.isArray(material.submission_file_types)
        ? material.submission_file_types.filter((value): value is string => typeof value === "string")
        : undefined,
      deleted_at: null,
      deleted_by: null,
    })
    .eq("id", materialId);
  if (updateError) throw new Error(updateError.message);

  const { error: hideError } = await db
    .from("blocks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("material_id", materialId)
    .is("deleted_at", null);
  if (hideError) throw new Error(hideError.message);

  const blocks = snapshotBlocks(snapshot);
  if (blocks.length === 0) return;

  const { error: insertError } = await db.from("blocks").insert(
    blocks.map((block) => ({
      material_id: materialId,
      kind: block.kind,
      body: block.body as Json,
      position: block.position,
      file_id: block.file_id,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}
