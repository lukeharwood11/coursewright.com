import { requireSupabase } from "./client";
import { nextPosition } from "@/units/model/order";

export type UnitRecord = {
  id: number;
  organizationId: number;
  courseId: number;
  title: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
  isResources: boolean;
  deletedAt: string | null;
};

export const unitQueryKeys = {
  list: (courseId: number) => ["units", "list", courseId] as const,
  detail: (id: number) => ["units", "detail", id] as const,
  byCourse: (courseId: number) => ["units", "course", courseId] as const,
};

const UNIT_COLUMNS =
  "id, organization_id, course_id, title, position, start_date, end_date, is_resources, deleted_at";

type UnitRow = {
  id: number;
  organization_id: number;
  course_id: number | null;
  title: string;
  position: number;
  start_date: string | null;
  end_date: string | null;
  is_resources: boolean;
  deleted_at: string | null;
};

function toUnit(row: UnitRow): UnitRecord | null {
  if (row.course_id == null) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    title: row.title,
    position: row.position,
    startDate: row.start_date,
    endDate: row.end_date,
    isResources: row.is_resources,
    deletedAt: row.deleted_at,
  };
}

export async function getUnit(id: number): Promise<UnitRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("units")
    .select(UNIT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toUnit(data);
}

export async function listUnitsForCourse(courseId: number): Promise<UnitRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("units")
    .select(UNIT_COLUMNS)
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("position")
    .order("id");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const unit = toUnit(row);
    return unit ? [unit] : [];
  });
}

export const listUnitsByCourse = listUnitsForCourse;

export async function createUnit(args: {
  organizationId: number;
  courseId: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
}): Promise<UnitRecord> {
  const siblings = await listUnitsForCourse(args.courseId);
  const db = requireSupabase();
  const { data, error } = await db
    .from("units")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      title: args.title,
      start_date: args.startDate,
      end_date: args.endDate,
      position: nextPosition(siblings.map((row) => row.position)),
    })
    .select(UNIT_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const unit = data ? toUnit(data) : null;
  if (!unit) throw new Error("The unit was created but couldn’t be opened yet.");
  return unit;
}

export async function updateUnit(
  id: number,
  patch: {
    title?: string;
    startDate?: string | null;
    endDate?: string | null;
    position?: number;
  },
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("units")
    .update({
      title: patch.title,
      start_date: patch.startDate,
      end_date: patch.endDate,
      position: patch.position,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteUnit(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("units")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function restoreUnit(id: number): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("units")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    (error.message ?? "").toLowerCase().includes("duplicate")
  );
}

/** Live Resources unit for the course, creating it again when it was removed. */
export async function ensureResourcesUnit(
  organizationId: number,
  courseId: number,
): Promise<UnitRecord> {
  const units = await listUnitsForCourse(courseId);
  const existing = units.find((unit) => unit.isResources);
  if (existing) return existing;

  const db = requireSupabase();
  const { data, error } = await db
    .from("units")
    .insert({
      organization_id: organizationId,
      course_id: courseId,
      title: "Resources",
      start_date: null,
      end_date: null,
      position: nextPosition(units.map((row) => row.position)),
      is_resources: true,
    })
    .select(UNIT_COLUMNS)
    .maybeSingle();

  if (error) {
    if (isUniqueViolation(error)) {
      const again = await listUnitsForCourse(courseId);
      const raced = again.find((unit) => unit.isResources);
      if (raced) return raced;
    }
    throw new Error(error.message);
  }
  const unit = data ? toUnit(data) : null;
  if (!unit) throw new Error("The Resources unit was created but couldn’t be opened yet.");
  return unit;
}
