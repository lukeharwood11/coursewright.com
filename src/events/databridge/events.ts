import type { Json } from "@/infrastructure/supabase/database.types";
import type { BlockRecord } from "@/materials/databridge/blocks";
import { parseBlockKind } from "@/materials/model/kind";
import type { PageBlockDraft } from "@/materials/model/pageContent";
import { parseEventAudience, type EventAudience } from "@/events/model/audience";
import { eventOverlapsRange } from "@/events/model/schedule";
import { requireSupabase } from "./client";

export type EventMaterialLink = {
  id: number;
  title: string;
  courseId: number;
  unitId: number | null;
};

export type EventRecord = {
  id: number;
  organizationId: number;
  audience: EventAudience;
  courseIds: number[];
  classIds: number[];
  title: string;
  location: string;
  startsOn: string;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
  courseTitles: string[];
  classTitles: string[];
  blocks: BlockRecord[];
  materials: EventMaterialLink[];
};

export type EventSummary = Omit<EventRecord, "blocks" | "materials">;

const EVENT_COLUMNS =
  "id, organization_id, audience, course_ids, class_ids, title, location, starts_on, ends_on, start_time, end_time, deleted_at";

type EventRow = {
  id: number;
  organization_id: number;
  audience: string;
  course_ids: number[] | null;
  class_ids: number[] | null;
  title: string;
  location: string;
  starts_on: string;
  ends_on: string | null;
  start_time: string | null;
  end_time: string | null;
  deleted_at: string | null;
};

function asIdList(value: number[] | null | undefined): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id) => typeof id === "number" && Number.isFinite(id));
}

export const eventQueryKeys = {
  detail: (id: number) => ["events", "detail", id] as const,
  course: (courseId: number) => ["events", "course", courseId] as const,
  classGroup: (classId: number) => ["events", "class", classId] as const,
};

async function labelsFor(row: {
  audience: EventAudience;
  courseIds: number[];
  classIds: number[];
}): Promise<{ courseTitles: string[]; classTitles: string[] }> {
  const db = requireSupabase();
  if (row.audience === "course" && row.courseIds.length > 0) {
    const { data, error } = await db
      .from("courses")
      .select("id, title")
      .in("id", row.courseIds);
    if (error) throw new Error(error.message);
    const byId = new Map((data ?? []).map((course) => [course.id, course.title]));
    return {
      courseTitles: row.courseIds.map((id) => byId.get(id) ?? "Course"),
      classTitles: [],
    };
  }
  if (row.audience === "class" && row.classIds.length > 0) {
    const { data, error } = await db
      .from("classes")
      .select("id, title")
      .in("id", row.classIds);
    if (error) throw new Error(error.message);
    const byId = new Map((data ?? []).map((group) => [group.id, group.title]));
    return {
      courseTitles: [],
      classTitles: row.classIds.map((id) => byId.get(id) ?? "Class"),
    };
  }
  return { courseTitles: [], classTitles: [] };
}

function toSummary(row: EventRow): Omit<EventSummary, "courseTitles" | "classTitles"> | null {
  const audience = parseEventAudience(row.audience);
  if (!audience || row.deleted_at) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    audience,
    courseIds: asIdList(row.course_ids),
    classIds: asIdList(row.class_ids),
    title: row.title,
    location: row.location,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    startTime: row.start_time,
    endTime: row.end_time,
  };
}

async function withLabels(
  rows: Array<Omit<EventSummary, "courseTitles" | "classTitles">>,
): Promise<EventSummary[]> {
  const db = requireSupabase();
  const courseIds = [...new Set(rows.flatMap((row) => row.courseIds))];
  const classIds = [...new Set(rows.flatMap((row) => row.classIds))];
  const [courses, classes] = await Promise.all([
    courseIds.length === 0
      ? Promise.resolve(new Map<number, string>())
      : db
          .from("courses")
          .select("id, title")
          .in("id", courseIds)
          .then(({ data, error }) => {
            if (error) throw new Error(error.message);
            return new Map((data ?? []).map((row) => [row.id, row.title]));
          }),
    classIds.length === 0
      ? Promise.resolve(new Map<number, string>())
      : db
          .from("classes")
          .select("id, title")
          .in("id", classIds)
          .then(({ data, error }) => {
            if (error) throw new Error(error.message);
            return new Map((data ?? []).map((row) => [row.id, row.title]));
          }),
  ]);
  return rows.map((row) => ({
    ...row,
    courseTitles: row.courseIds.map((id) => courses.get(id) ?? "Course"),
    classTitles: row.classIds.map((id) => classes.get(id) ?? "Class"),
  }));
}

export async function listEventsOverlapping(
  organizationId: number,
  rangeStart: string,
  rangeEnd: string,
): Promise<EventSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .lte("starts_on", rangeEnd)
    .or(`ends_on.gte.${rangeStart},ends_on.is.null`)
    .order("starts_on")
    .order("id");
  if (error) throw new Error(error.message);
  const rows = (data ?? []).flatMap((row) => {
    const summary = toSummary(row as EventRow);
    if (!summary) return [];
    if (!eventOverlapsRange(summary.startsOn, summary.endsOn, rangeStart, rangeEnd)) {
      return [];
    }
    return [summary];
  });
  return withLabels(rows);
}

export async function listEventsForCourse(courseId: number): Promise<EventSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("events")
    .select(EVENT_COLUMNS)
    .contains("course_ids", [courseId])
    .is("deleted_at", null)
    .order("starts_on", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).flatMap((row) => {
    const summary = toSummary(row as EventRow);
    return summary ? [summary] : [];
  });
  return withLabels(rows);
}

export async function listEventsForClass(classId: number): Promise<EventSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("events")
    .select(EVENT_COLUMNS)
    .contains("class_ids", [classId])
    .is("deleted_at", null)
    .order("starts_on", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).flatMap((row) => {
    const summary = toSummary(row as EventRow);
    return summary ? [summary] : [];
  });
  return withLabels(rows);
}

async function listBlocks(eventId: number): Promise<BlockRecord[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("event_blocks")
    .select("id, event_id, kind, body, position, file_id")
    .eq("event_id", eventId)
    .is("deleted_at", null)
    .order("position")
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const kind = parseBlockKind(row.kind);
    if (!kind || kind === "quiz") return [];
    return [
      {
        id: row.id,
        materialId: row.event_id,
        kind,
        body: row.body,
        position: row.position,
        fileId: row.file_id,
      },
    ];
  });
}

async function listMaterialLinks(eventId: number): Promise<EventMaterialLink[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("event_materials")
    .select("position, material:materials(id, title, course_id, unit_id, deleted_at)")
    .eq("event_id", eventId)
    .order("position")
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const material = Array.isArray(row.material) ? row.material[0] : row.material;
    if (!material || material.deleted_at || material.course_id == null) return [];
    return [
      {
        id: material.id,
        title: material.title,
        courseId: material.course_id,
        unitId: material.unit_id,
      },
    ];
  });
}

export async function getEvent(id: number): Promise<EventRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const summary = toSummary(data as EventRow);
  if (!summary) return null;
  const [labels, blocks, materials] = await Promise.all([
    labelsFor(summary),
    listBlocks(id),
    listMaterialLinks(id),
  ]);
  return { ...summary, ...labels, blocks, materials };
}

export type EventWrite = {
  organizationId: number;
  audience: EventAudience;
  courseIds: number[];
  classIds: number[];
  title: string;
  location: string;
  startsOn: string;
  endsOn: string | null;
  startTime: string | null;
  endTime: string | null;
};

function eventColumns(input: EventWrite) {
  return {
    organization_id: input.organizationId,
    audience: input.audience,
    course_ids: input.audience === "course" ? input.courseIds : [],
    class_ids: input.audience === "class" ? input.classIds : [],
    title: input.title.trim(),
    location: input.location.trim(),
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    start_time: input.startTime,
    end_time: input.endTime,
  };
}

export async function createEvent(input: EventWrite, userId: string): Promise<number> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("events")
    .insert({ ...eventColumns(input), created_by: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateEvent(id: number, input: EventWrite): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("events").update(eventColumns(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteEvent(id: number, userId: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("events")
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveEventBlocks(
  eventId: number,
  blocks: PageBlockDraft[],
): Promise<void> {
  const db = requireSupabase();
  const existing = await listBlocks(eventId);
  const keep = Math.min(existing.length, blocks.length);
  for (let index = 0; index < keep; index += 1) {
    const draft = blocks[index]!;
    const current = existing[index]!;
    if (current.kind === draft.kind) {
      const { error } = await db
        .from("event_blocks")
        .update({
          body: draft.body as Json,
          position: draft.position,
          file_id: draft.fileId,
        })
        .eq("id", current.id);
      if (error) throw new Error(error.message);
      continue;
    }
    const { error: hideError } = await db
      .from("event_blocks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", current.id);
    if (hideError) throw new Error(hideError.message);
    const { error: createError } = await db.from("event_blocks").insert({
      event_id: eventId,
      kind: draft.kind,
      body: draft.body as Json,
      position: draft.position,
      file_id: draft.fileId,
    });
    if (createError) throw new Error(createError.message);
  }
  for (let index = keep; index < blocks.length; index += 1) {
    const draft = blocks[index]!;
    const { error } = await db.from("event_blocks").insert({
      event_id: eventId,
      kind: draft.kind,
      body: draft.body as Json,
      position: draft.position,
      file_id: draft.fileId,
    });
    if (error) throw new Error(error.message);
  }
  for (let index = keep; index < existing.length; index += 1) {
    const { error } = await db
      .from("event_blocks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", existing[index]!.id);
    if (error) throw new Error(error.message);
  }
}

export async function saveEventMaterials(
  eventId: number,
  materialIds: number[],
): Promise<void> {
  const db = requireSupabase();
  const { error: deleteError } = await db
    .from("event_materials")
    .delete()
    .eq("event_id", eventId);
  if (deleteError) throw new Error(deleteError.message);
  if (materialIds.length === 0) return;
  const { error } = await db.from("event_materials").insert(
    materialIds.map((materialId, position) => ({
      event_id: eventId,
      material_id: materialId,
      position,
    })),
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
