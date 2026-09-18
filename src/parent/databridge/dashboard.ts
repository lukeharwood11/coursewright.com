import { supabase } from "@/infrastructure/supabase/client";
import { calendarWeekContaining, localIsoDate } from "@/parent/model/thisWeek";
import { buildParentDashboard } from "@/parent/model/dashboard";
import type { ParentDashboard, ParentDashboardSource } from "@/parent/model/dashboard";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Accounts aren’t connected yet. Add Supabase URL and anon key to .env.testing.",
    );
  }
  return supabase;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const parentQueryKeys = {
  dashboard: (orgId: number, userId: string) =>
    ["parent", "dashboard", orgId, userId] as const,
};

export async function loadParentDashboard(
  organizationId: number,
  userId: string,
): Promise<ParentDashboard> {
  const db = requireSupabase();
  const week = calendarWeekContaining();
  const today = localIsoDate();

  const { data: links, error: linksError } = await db
    .from("parent_student_links")
    .select("student_profile_id")
    .eq("parent_user_id", userId);

  if (linksError) throw new Error(linksError.message);

  const studentIds = (links ?? []).map((row) => row.student_profile_id);
  if (studentIds.length === 0) {
    return buildParentDashboard({
      week,
      today,
      students: [],
      enrollments: [],
      materials: [],
      importantNow: [],
    });
  }

  const [studentsResult, enrollmentsResult, importantResult] = await Promise.all([
    db
      .from("student_profiles")
      .select("id, name, grade_level")
      .eq("organization_id", organizationId)
      .in("id", studentIds)
      .order("name"),
    db
      .from("enrollments")
      .select(
        "student_profile_id, status, course:courses(id, title, status, visibility, organization_id)",
      )
      .eq("status", "active")
      .in("student_profile_id", studentIds),
    db
      .from("important_now")
      .select(
        "id, material_id, course_id, material:materials(title, description, unit_id), course:courses(title)",
      )
      .eq("organization_id", organizationId),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);
  if (importantResult.error) throw new Error(importantResult.error.message);

  const enrollments = (enrollmentsResult.data ?? []).flatMap((row) => {
    const course = one(row.course);
    if (!course || course.organization_id !== organizationId) return [];
    if (course.status !== "active" || course.visibility !== "published") return [];
    return [
      {
        studentId: row.student_profile_id,
        courseId: course.id,
        courseTitle: course.title,
        courseStatus: course.status,
      },
    ];
  });

  const courseIds = [...new Set(enrollments.map((row) => row.courseId))];

  let materials: ParentDashboardSource["materials"] = [];

  if (courseIds.length > 0) {
    const materialsResult = await db
      .from("materials")
      .select(
        "id, title, scheduled_date, due_date, course_id, status, deleted_at, visibility, unit:units(id, start_date, end_date)",
      )
      .in("course_id", courseIds)
      .is("deleted_at", null)
      .eq("status", "active")
      .eq("visibility", "published");

    if (materialsResult.error) throw new Error(materialsResult.error.message);

    materials = (materialsResult.data ?? []).flatMap((row) => {
      if (!row.course_id) return [];
      const unit = one(row.unit);
      return [
        {
          id: row.id,
          title: row.title,
          scheduledDate: row.scheduled_date,
          dueDate: row.due_date,
          courseId: row.course_id,
          unitId: unit?.id ?? null,
          unitStart: unit?.start_date ?? null,
          unitEnd: unit?.end_date ?? null,
        },
      ];
    });
  }

  const importantNow = (importantResult.data ?? []).flatMap((row) => {
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

  return buildParentDashboard({
    week,
    today,
    students: (studentsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      gradeLevel: row.grade_level,
    })),
    enrollments,
    materials,
    importantNow,
  });
}
