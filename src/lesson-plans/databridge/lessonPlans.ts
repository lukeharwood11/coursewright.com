import { requireSupabase } from "./client";
import { parseMaterialKind, type MaterialKind } from "@/materials/model/kind";
import {
  parseMaterialVisibility,
  type MaterialVisibility,
} from "@/materials/model/visibility";
import { parseCourseColorKey, type CourseColorKey } from "@/courses/model/courseColor";
import {
  daysToPersist,
  visibleDaysForWeek,
  type LessonPlanDayDraft,
  type LessonPlanDraft,
} from "@/lesson-plans/model/validate";
import type { SchoolDay } from "@/organizations/model/schoolDays";
import {
  parseLessonPlanVisibility,
  type LessonPlanVisibility,
} from "@/lesson-plans/model/visibility";

export type LessonPlanMaterialRecord = {
  id: number;
  title: string;
  description: string;
  kind: MaterialKind;
  unitId: number | null;
  visibility: MaterialVisibility;
};

export type LessonPlanDayRecord = {
  id: number;
  date: string;
  body: string;
  materials: LessonPlanMaterialRecord[];
};

export type LessonPlanRecord = {
  id: number;
  organizationId: number;
  courseId: number;
  weekStart: string;
  title: string;
  weekNote: string;
  visibility: LessonPlanVisibility;
  deletedAt: string | null;
};

export type LessonPlanListItem = LessonPlanRecord & {
  courseTitle: string;
  colorKey: CourseColorKey;
  materialCount: number;
};

export type LessonPlanDetail = LessonPlanRecord & {
  courseTitle: string;
  colorKey: CourseColorKey;
  days: LessonPlanDayRecord[];
};

export const lessonPlanQueryKeys = {
  course: (courseId: number) => ["lesson-plans", "course", courseId] as const,
  org: (organizationId: number) => ["lesson-plans", "org", organizationId] as const,
  range: (organizationId: number, start: string, end: string) =>
    ["lesson-plans", "range", organizationId, start, end] as const,
  detail: (id: number) => ["lesson-plans", "detail", id] as const,
};

const PLAN_COLUMNS =
  "id, organization_id, course_id, week_start, title, week_note, visibility, deleted_at";

type PlanRow = {
  id: number;
  organization_id: number;
  course_id: number;
  week_start: string;
  title: string;
  week_note: string;
  visibility: string;
  deleted_at: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toPlan(row: PlanRow): LessonPlanRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    weekStart: row.week_start,
    title: row.title,
    weekNote: row.week_note,
    visibility: parseLessonPlanVisibility(row.visibility),
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

function toPlanMaterial(row: MaterialEmbed): LessonPlanMaterialRecord | null {
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

type DayEmbed = {
  id: number;
  day_date: string;
  body: string;
  lesson_plan_day_materials?: Array<{
    position: number;
    material: MaterialEmbed | MaterialEmbed[] | null;
  }>;
};

function toDays(days: DayEmbed[] | null | undefined): LessonPlanDayRecord[] {
  return [...(days ?? [])]
    .sort((a, b) => a.day_date.localeCompare(b.day_date))
    .map((day) => {
      const links = [...(day.lesson_plan_day_materials ?? [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      );
      return {
        id: day.id,
        date: day.day_date,
        body: day.body,
        materials: links.flatMap((link) => {
          const material = one(link.material);
          if (!material) return [];
          const mapped = toPlanMaterial(material);
          return mapped ? [mapped] : [];
        }),
      };
    });
}

function materialCountFromDays(
  days: Array<{ lesson_plan_day_materials?: unknown[] | null }> | null | undefined,
): number {
  return (days ?? []).reduce((count, day) => {
    const links = day.lesson_plan_day_materials ?? [];
    return count + links.length;
  }, 0);
}

type ListRow = PlanRow & {
  course?: { title: string; color_key: string } | { title: string; color_key: string }[] | null;
  lesson_plan_days?: Array<{
    id: number;
    lesson_plan_day_materials?: unknown[] | null;
  }> | null;
};

function toListItem(row: ListRow): LessonPlanListItem {
  const course = one(row.course);
  return {
    ...toPlan(row),
    courseTitle: course?.title ?? "",
    colorKey: parseCourseColorKey(course?.color_key),
    materialCount: materialCountFromDays(row.lesson_plan_days),
  };
}

export async function listLessonPlansForCourse(
  courseId: number,
): Promise<LessonPlanListItem[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("lesson_plans")
    .select(
      `${PLAN_COLUMNS}, course:courses(title, color_key), lesson_plan_days(id, lesson_plan_day_materials(id))`,
    )
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .order("week_start", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toListItem(row));
}

export async function listLessonPlansInRange(
  organizationId: number,
  rangeStart: string,
  rangeEnd: string,
): Promise<LessonPlanDetail[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("lesson_plans")
    .select(
      `${PLAN_COLUMNS}, course:courses(title, color_key), lesson_plan_days(id, day_date, body, lesson_plan_day_materials(position, material:materials(id, title, description, kind, unit_id, visibility, deleted_at)))`,
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .lte("week_start", rangeEnd)
    .gte("week_start", addDays(rangeStart, -6));

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const course = one(row.course);
    const weekEnd = addDays(row.week_start, 6);
    if (weekEnd < rangeStart || row.week_start > rangeEnd) return [];
    return [
      {
        ...toPlan(row),
        courseTitle: course?.title ?? "",
        colorKey: parseCourseColorKey(course?.color_key),
        days: toDays(row.lesson_plan_days),
      },
    ];
  });
}

export async function findLessonPlanForWeek(
  courseId: number,
  weekStart: string,
): Promise<LessonPlanRecord | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("lesson_plans")
    .select(PLAN_COLUMNS)
    .eq("course_id", courseId)
    .eq("week_start", weekStart)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toPlan(data) : null;
}

export async function getLessonPlan(id: number): Promise<LessonPlanDetail | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("lesson_plans")
    .select(
      `${PLAN_COLUMNS}, course:courses(title, color_key), lesson_plan_days(id, day_date, body, lesson_plan_day_materials(position, material:materials(id, title, description, kind, unit_id, visibility, deleted_at)))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const course = one(data.course);
  return {
    ...toPlan(data),
    courseTitle: course?.title ?? "",
    colorKey: parseCourseColorKey(course?.color_key),
    days: toDays(data.lesson_plan_days),
  };
}

async function replaceDays(planId: number, days: LessonPlanDayDraft[]): Promise<void> {
  const db = requireSupabase();
  const { error: deleteError } = await db
    .from("lesson_plan_days")
    .delete()
    .eq("lesson_plan_id", planId);
  if (deleteError) throw new Error(deleteError.message);

  const kept = daysToPersist(days);
  if (kept.length === 0) return;

  for (const day of kept) {
    const { data, error } = await db
      .from("lesson_plan_days")
      .insert({
        lesson_plan_id: planId,
        day_date: day.date,
        body: day.body,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || day.materialIds.length === 0) continue;
    const { error: linkError } = await db.from("lesson_plan_day_materials").insert(
      day.materialIds.map((materialId, index) => ({
        lesson_plan_day_id: data.id,
        material_id: materialId,
        position: index,
      })),
    );
    if (linkError) throw new Error(linkError.message);
  }
}

export async function createLessonPlan(args: {
  organizationId: number;
  courseId: number;
  createdBy: string;
  draft: LessonPlanDraft;
}): Promise<LessonPlanRecord> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("lesson_plans")
    .insert({
      organization_id: args.organizationId,
      course_id: args.courseId,
      week_start: args.draft.weekStart,
      title: args.draft.title.trim(),
      week_note: args.draft.weekNote.trim(),
      visibility: "unpublished",
      created_by: args.createdBy,
    })
    .select(PLAN_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("The lesson plan was created but couldn’t be opened yet.");

  await replaceDays(data.id, args.draft.days);
  return toPlan(data);
}

export async function updateLessonPlan(id: number, draft: LessonPlanDraft): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("lesson_plans")
    .update({
      week_start: draft.weekStart,
      title: draft.title.trim(),
      week_note: draft.weekNote.trim(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await replaceDays(id, draft.days);
}

export async function updateLessonPlanVisibility(
  id: number,
  visibility: LessonPlanVisibility,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("lesson_plans").update({ visibility }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function softDeleteLessonPlan(id: number, deletedBy: string): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("lesson_plans")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function draftFromDetail(
  detail: LessonPlanDetail,
  schoolDays: readonly SchoolDay[],
): LessonPlanDraft {
  const existing: LessonPlanDayDraft[] = detail.days.map((day) => ({
    date: day.date,
    body: day.body,
    materialIds: day.materials.map((material) => material.id),
  }));
  return {
    title: detail.title,
    weekNote: detail.weekNote,
    weekStart: detail.weekStart,
    days: visibleDaysForWeek(detail.weekStart, schoolDays, {
      existingDays: existing,
    }),
  };
}

function addDays(isoDate: string, amount: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + amount);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
