import { supabase } from "@/infrastructure/supabase/client";
import { parseAnnouncementAudience } from "@/announcements/model/audience";
import { familyVisibleMaterials } from "@/app/layouts/model/viewMode";
import { listLessonPlansInRange } from "@/lesson-plans/databridge/lessonPlans";
import { isPublished } from "@/materials/model/visibility";
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

function announcementAuthorName(
  author: { name: string } | { name: string }[] | null | undefined,
): string {
  const profile = one(author);
  const name = profile?.name?.trim();
  return name || "Teacher";
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
      lessonPlans: [],
      classMemberships: [],
      announcements: [],
    });
  }

  const [studentsResult, enrollmentsResult, importantResult, membersResult, announcementsResult] =
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
        "student_profile_id, status, course:courses(id, title, status, visibility, organization_id, color_key)",
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
      .from("class_members")
      .select("class_id, student_profile_id")
      .in("student_profile_id", studentIds),
    db
      .from("announcements")
      .select(
        "id, title, body, start_date, end_date, created_at, created_by, audience, course_ids, class_ids, student_profile_ids, author:profiles!announcements_created_by_fkey(name), announcement_reads(user_id)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("announcement_reads.user_id", userId),
  ]);

  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (enrollmentsResult.error) throw new Error(enrollmentsResult.error.message);
  if (importantResult.error) throw new Error(importantResult.error.message);
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
        colorKey: course.color_key,
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

  const plans = await listLessonPlansInRange(organizationId, week.start, week.end);
  const lessonPlans = plans
    .filter(
      (plan) =>
        plan.weekStart === week.start &&
        isPublished(plan.visibility) &&
        courseIds.includes(plan.courseId),
    )
    .map((plan) => ({
      id: plan.id,
      title: plan.title,
      weekNote: plan.weekNote,
      weekStart: plan.weekStart,
      courseId: plan.courseId,
      courseTitle: plan.courseTitle,
      colorKey: plan.colorKey,
      visibility: plan.visibility,
      days: plan.days.map((day) => ({
        date: day.date,
        body: day.body,
        materials: familyVisibleMaterials(day.materials).map((material) => ({
          id: material.id,
          title: material.title,
          unitId: material.unitId,
        })),
      })),
    }));

  const classMemberships = (membersResult.data ?? []).map((row) => ({
    classId: row.class_id,
    studentId: row.student_profile_id,
  }));

  const announcementsRaw = (announcementsResult.data ?? []).flatMap((row) => {
    const audience = parseAnnouncementAudience(row.audience);
    if (!audience) return [];
    const reads = Array.isArray(row.announcement_reads)
      ? row.announcement_reads
      : [];
    const courseIds = Array.isArray(row.course_ids) ? row.course_ids : [];
    const classIds = Array.isArray(row.class_ids) ? row.class_ids : [];
    const studentIds = Array.isArray(row.student_profile_ids)
      ? row.student_profile_ids
      : [];
    return [
      {
        id: row.id,
        title: row.title,
        body: row.body,
        startDate: row.start_date,
        endDate: row.end_date,
        createdAt: row.created_at,
        authorName: announcementAuthorName(row.author),
        audience,
        courseIds,
        classIds,
        studentIds,
        read: reads.some((entry) => entry.user_id === userId),
      },
    ];
  });

  const announcementCourseIds = [
    ...new Set(announcementsRaw.flatMap((row) => row.courseIds)),
  ];
  const announcementClassIds = [
    ...new Set(announcementsRaw.flatMap((row) => row.classIds)),
  ];
  const announcementStudentIds = [
    ...new Set(announcementsRaw.flatMap((row) => row.studentIds)),
  ];

  const [courseTitleRows, classTitleRows, studentNameRows] = await Promise.all([
    announcementCourseIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: number; title: string }>, error: null })
      : db.from("courses").select("id, title").in("id", announcementCourseIds),
    announcementClassIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: number; title: string }>, error: null })
      : db.from("classes").select("id, title").in("id", announcementClassIds),
    announcementStudentIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ id: number; name: string }>, error: null })
      : db
          .from("student_profiles")
          .select("id, name")
          .in("id", announcementStudentIds),
  ]);

  if (courseTitleRows.error) throw new Error(courseTitleRows.error.message);
  if (classTitleRows.error) throw new Error(classTitleRows.error.message);
  if (studentNameRows.error) throw new Error(studentNameRows.error.message);

  const courseTitleById = new Map(
    (courseTitleRows.data ?? []).map((row) => [row.id, row.title]),
  );
  const classTitleById = new Map(
    (classTitleRows.data ?? []).map((row) => [row.id, row.title]),
  );
  const studentNameById = new Map(
    (studentNameRows.data ?? []).map((row) => [row.id, row.name]),
  );

  const announcements = announcementsRaw.map((row) => ({
    ...row,
    courseTitles: row.courseIds.map((id) => courseTitleById.get(id) ?? "Course"),
    classTitles: row.classIds.map((id) => classTitleById.get(id) ?? "Class"),
    studentNames: row.studentIds.map((id) => studentNameById.get(id) ?? "Student"),
  }));

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
    lessonPlans,
    classMemberships,
    announcements,
  });
}
