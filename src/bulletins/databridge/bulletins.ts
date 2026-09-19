import { requireSupabase } from "./client";
import { parseMaterialKind, type MaterialKind } from "@/materials/model/kind";
import {
  parseMaterialVisibility,
  type MaterialVisibility,
} from "@/materials/model/visibility";
import { uniqueMaterialIds, type BulletinDraft } from "@/bulletins/model/validate";

export type BulletinRecord = {
  id: number;
  organizationId: number;
  courseId: number;
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  deletedAt: string | null;
};

export type BulletinMaterialRecord = {
  id: number;
  title: string;
  description: string;
  kind: MaterialKind;
  unitId: number | null;
  visibility: MaterialVisibility;
};

export type BulletinListItem = BulletinRecord & {
  materialCount: number;
  courseTitle: string;
};

export type BulletinDetail = BulletinRecord & {
  courseTitle: string;
  materials: BulletinMaterialRecord[];
};

export const bulletinQueryKeys = {
  course: (courseId: number) => ["bulletins", "course", courseId] as const,
  org: (organizationId: number) => ["bulletins", "org", organizationId] as const,
  detail: (id: number) => ["bulletins", "detail", id] as const,
};

const BULLETIN_COLUMNS =
  "id, organization_id, course_id, title, body, start_date, end_date, deleted_at";

type BulletinRow = {
  id: number;
  organization_id: number;
  course_id: number;
  title: string;
  body: string;
  start_date: string;
  end_date: string;
  deleted_at: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toBulletin(row: BulletinRow): BulletinRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    title: row.title,
    body: row.body,
    startDate: row.start_date,
    endDate: row.end_date,
    deletedAt: row.deleted_at,
  };
}

type MaterialEmbed = {
  id: number;
  title: string;
  description: string;
  kind: string;
  unit_id: number | null;
  visibility: string;
  deleted_at: string | null;
};

function toBulletinMaterial(row: MaterialEmbed): BulletinMaterialRecord | null {
  if (row.deleted_at) return null;
  const kind = parseMaterialKind(row.kind);
  if (!kind) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind,
    unitId: row.unit_id,
    visibility: parseMaterialVisibility(row.visibility),
  };
}

export async function listBulletinsForCourse(
  courseId: number,
): Promise<BulletinListItem[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("bulletins")
    .select(
      `${BULLETIN_COLUMNS}, course:courses(title), bulletin_materials(id)`,
    )
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const course = one(row.course);
    const links = Array.isArray(row.bulletin_materials)
      ? row.bulletin_materials
      : [];
    return {
      ...toBulletin(row),
      courseTitle: course?.title ?? "",
      materialCount: links.length,
    };
  });
}

export async function listBulletinsForOrganization(
  organizationId: number,
): Promise<BulletinListItem[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("bulletins")
    .select(
      `${BULLETIN_COLUMNS}, course:courses(title), bulletin_materials(id)`,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const course = one(row.course);
    const links = Array.isArray(row.bulletin_materials)
      ? row.bulletin_materials
      : [];
    return {
      ...toBulletin(row),
      courseTitle: course?.title ?? "",
      materialCount: links.length,
    };
  });
}

export async function getBulletin(id: number): Promise<BulletinDetail | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("bulletins")
    .select(
      `${BULLETIN_COLUMNS}, course:courses(title), bulletin_materials(position, material:materials(id, title, description, kind, unit_id, visibility, deleted_at))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const course = one(data.course);
  const links = Array.isArray(data.bulletin_materials)
    ? [...data.bulletin_materials].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      )
    : [];

  return {
    ...toBulletin(data),
    courseTitle: course?.title ?? "",
    materials: links.flatMap((link) => {
      const material = one(link.material);
      if (!material) return [];
      const mapped = toBulletinMaterial(material);
      return mapped ? [mapped] : [];
    }),
  };
}

async function replaceBulletinMaterials(
  bulletinId: number,
  materialIds: number[],
): Promise<void> {
  const db = requireSupabase();
  const { error: deleteError } = await db
    .from("bulletin_materials")
    .delete()
    .eq("bulletin_id", bulletinId);
  if (deleteError) throw new Error(deleteError.message);

  const ids = uniqueMaterialIds(materialIds);
  if (ids.length === 0) return;

  const { error: insertError } = await db.from("bulletin_materials").insert(
    ids.map((materialId, index) => ({
      bulletin_id: bulletinId,
      material_id: materialId,
      position: index,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}

export async function createBulletin(args: {
  organizationId: number;
  courseId: number;
  createdBy: string;
  draft: BulletinDraft;
}): Promise<BulletinRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("bulletins")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      title: args.draft.title.trim(),
      body: args.draft.body.trim(),
      start_date: args.draft.startDate,
      end_date: args.draft.endDate,
      created_by: args.createdBy,
    })
    .select(BULLETIN_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("The bulletin was created but couldn’t be opened yet.");

  await replaceBulletinMaterials(data.id, args.draft.materialIds);
  return toBulletin(data);
}

export async function updateBulletin(
  id: number,
  draft: BulletinDraft,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("bulletins")
    .update({
      title: draft.title.trim(),
      body: draft.body.trim(),
      start_date: draft.startDate,
      end_date: draft.endDate,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await replaceBulletinMaterials(id, draft.materialIds);
}

export async function softDeleteBulletin(
  id: number,
  deletedBy: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("bulletins")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
