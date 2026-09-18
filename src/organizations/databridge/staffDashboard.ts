import {
  listCourses,
  listCoursesCatalogMeta,
  type CourseCatalogMeta,
  type CourseSummary,
} from "@/courses/databridge/courses";
import { calendarWeekContaining } from "@/parent/model/thisWeek";
import {
  buildStaffDashboard,
  type StaffDashboard,
  type StaffDashboardMaterial,
  type StaffImportantNowItem,
  type StaffPeopleCounts,
} from "@/organizations/model/staffDashboard";
import { requireSupabase } from "./client";
import { orgQueryKeys } from "./memberships";

export const staffDashboardQueryKey = (orgId: number) =>
  [...orgQueryKeys.detail(orgId), "staffDashboard"] as const;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function countExact(
  table: "student_profiles" | "classes",
  organizationId: number,
  softDelete = false,
): Promise<number> {
  const db = requireSupabase();
  let query = db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (softDelete) {
    query = query.is("deleted_at", null);
  }
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function loadStaffPeopleCounts(
  organizationId: number,
): Promise<StaffPeopleCounts> {
  const [studentCount, classCount] = await Promise.all([
    countExact("student_profiles", organizationId),
    countExact("classes", organizationId, true),
  ]);
  return { studentCount, classCount };
}

async function loadWeekMaterials(
  courseIds: number[],
): Promise<StaffDashboardMaterial[]> {
  if (courseIds.length === 0) return [];
  const db = requireSupabase();
  const { data, error } = await db
    .from("materials")
    .select(
      "id, title, scheduled_date, course_id, status, deleted_at, unit:units(id, start_date, end_date)",
    )
    .in("course_id", courseIds)
    .is("deleted_at", null)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    if (!row.course_id) return [];
    const unit = one(row.unit);
    return [
      {
        id: row.id,
        title: row.title,
        scheduledDate: row.scheduled_date,
        courseId: row.course_id,
        unitId: unit?.id ?? null,
        unitStart: unit?.start_date ?? null,
        unitEnd: unit?.end_date ?? null,
      },
    ];
  });
}

async function loadImportantNow(
  organizationId: number,
): Promise<StaffImportantNowItem[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("important_now")
    .select(
      "id, material_id, course_id, material:materials(title, description, unit_id), course:courses(title)",
    )
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const material = one(row.material);
    const course = one(row.course);
    if (!material || !course) return [];
    return [
      {
        id: row.id,
        materialId: row.material_id,
        materialTitle: material.title,
        materialDescription: material.description,
        courseId: row.course_id,
        courseTitle: course.title,
        unitId: material.unit_id ?? null,
      },
    ];
  });
}

export async function loadStaffDashboard(
  organizationId: number,
): Promise<StaffDashboard> {
  const week = calendarWeekContaining();
  const courses = await listCourses(organizationId);
  const courseIds = courses.map((course) => course.id);

  const [catalogByCourseId, materials, importantNow, people] = await Promise.all([
    listCoursesCatalogMeta(courseIds),
    loadWeekMaterials(courseIds),
    loadImportantNow(organizationId),
    loadStaffPeopleCounts(organizationId),
  ]);

  return buildStaffDashboard({
    week,
    courses,
    catalogByCourseId,
    materials,
    importantNow,
    people,
  });
}

export type { CourseCatalogMeta, CourseSummary, StaffDashboard };
