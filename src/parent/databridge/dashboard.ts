import { supabase } from "@/infrastructure/supabase/client";
import { parseAnnouncementAudience } from "@/announcements/model/audience";
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
      bulletins: [],
      classMemberships: [],
      announcements: [],
    });
  }

  const [studentsResult, enrollmentsResult, importantResult, bulletinsResult, membersResult, announcementsResult] =
    await Promise.all([
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
    db
      .from("bulletins")
      .select(
        "id, title, body, start_date, end_date, course_id, course:courses(title), bulletin_materials(id)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    db
      .from("class_members")
      .select("class_id, student_profile_id")
      .in("student_profile_id", studentIds),
    db
      .from("announcements")
      .select(
        "id, title, body, start_date, end_date, audience, course_id, class_id, student_profile_id, course:courses!announcements_course_id_fkey(title), class_group:classes!announcements_class_id_fkey(title), student:student_profiles!announcements_student_profile_id_fkey(name), announcement_reads(user_id)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("announcement_reads.user_id", userId),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);
  if (importantResult.error) throw new Error(importantResult.error.message);
  if (bulletinsResult.error) throw new Error(bulletinsResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);
  if (announcementsResult.error) throw new Error(announcementsResult.error.message);

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

  const bulletins = (bulletinsResult.data ?? []).flatMap((row) => {
    const course = one(row.course);
    if (!course) return [];
    const links = Array.isArray(row.bulletin_materials)
      ? row.bulletin_materials
      : [];
    return [
      {
        id: row.id,
        title: row.title,
        body: row.body,
        startDate: row.start_date,
        endDate: row.end_date,
        courseId: row.course_id,
        courseTitle: course.title,
        materialCount: links.length,
      },
    ];
  });

  const classMemberships = (membersResult.data ?? []).map((row) => ({
    classId: row.class_id,
    studentId: row.student_profile_id,
  }));

  const announcements = (announcementsResult.data ?? []).flatMap((row) => {
    const audience = parseAnnouncementAudience(row.audience);
    if (!audience) return [];
    const reads = Array.isArray(row.announcement_reads)
      ? row.announcement_reads
      : [];
    return [
      {
        id: row.id,
        title: row.title,
        body: row.body,
        startDate: row.start_date,
        endDate: row.end_date,
        audience,
        courseId: row.course_id,
        classId: row.class_id,
        studentId: row.student_profile_id,
        courseTitle: one(row.course)?.title ?? null,
        classTitle: one(row.class_group)?.title ?? null,
        studentName: one(row.student)?.name ?? null,
        read: reads.some((entry) => entry.user_id === userId),
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
    bulletins,
    classMemberships,
    announcements,
  });
}
