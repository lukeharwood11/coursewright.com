import { supabase } from "@/infrastructure/supabase/client";
import { parseAnnouncementAudience } from "@/announcements/model/audience";
import { familyVisibleMaterials } from "@/app/layouts/model/viewMode";
import { listLessonPlansInRange } from "@/lesson-plans/databridge/lessonPlans";
import { isPublished } from "@/materials/model/visibility";
import { localIsoDate } from "@/parent/model/thisWeek";
import { resolveOrgHomeWeek } from "@/parent/model/orgHomeWeek";
import { listEventsOverlapping } from "@/events/databridge/events";
import { buildParentDashboard } from "@/parent/model/dashboard";
import type { ParentDashboard, ParentDashboardSource } from "@/parent/model/dashboard";
import {
  buildInstructorPreviewSource,
  type TaughtCourseRow,
} from "@/parent/model/instructorPreview";
import { quizAssignedDate, quizDueDate } from "@/quizzes/model/window";

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

export type FamilyDashboardScope = "family" | "parent" | "student" | "preview";

export type ParentDashboardLoadOptions = {
  /** Sunday ISO; omit or null = real current week. */
  weekStart?: string | null;
};

function resolveDashboardWeek(options?: ParentDashboardLoadOptions) {
  return resolveOrgHomeWeek(options?.weekStart ?? null);
}

export const parentQueryKeys = {
  /** Prefix for invalidating every scope for a user in an org. */
  dashboardPrefix: (orgId: number, userId: string) =>
    ["parent", "dashboard", orgId, userId] as const,
  dashboard: (
    orgId: number,
    userId: string,
    scope: FamilyDashboardScope = "family",
    weekStart: string | null = null,
  ) => ["parent", "dashboard", orgId, userId, scope, weekStart] as const,
  taughtCourses: (orgId: number, userId: string) =>
    ["parent", "taught-courses", orgId, userId] as const,
};

/** Staff header mode → which family/preview dashboard to load. */
export async function loadDashboardForStaffViewMode(
  organizationId: number,
  userId: string,
  mode: "preview" | "parent" | "student" | "teacher",
  previewStudentName = "Preview",
  options?: ParentDashboardLoadOptions,
): Promise<ParentDashboard> {
  if (mode === "preview") {
    return loadInstructorPreviewDashboard(
      organizationId,
      userId,
      previewStudentName,
      options,
    );
  }
  if (mode === "parent") {
    return loadParentLinkedDashboard(organizationId, userId, options);
  }
  if (mode === "student") {
    return loadOwnStudentDashboard(organizationId, userId, options);
  }
  return loadParentDashboard(organizationId, userId, options);
}

export async function loadOwnStudentProfileIds(
  organizationId: number,
  userId: string,
): Promise<number[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.id);
}

export async function loadLinkedParentStudentIds(
  userId: string,
): Promise<number[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("parent_student_links")
    .select("student_profile_id")
    .eq("parent_user_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.student_profile_id);
}

/** Prefer own student profile; otherwise linked children (real family accounts). */
export async function loadFamilyStudentIds(
  organizationId: number,
  userId: string,
): Promise<number[]> {
  const ownIds = await loadOwnStudentProfileIds(organizationId, userId);
  if (ownIds.length > 0) return ownIds;
  return loadLinkedParentStudentIds(userId);
}

export async function listTaughtPublishedCourses(
  organizationId: number,
  userId: string,
): Promise<TaughtCourseRow[]> {
  const db = requireSupabase();
  const { data: links, error: linksError } = await db
    .from("course_instructors")
    .select("course_id")
    .eq("user_id", userId);

  if (linksError) throw new Error(linksError.message);

  const courseIds = [
    ...new Set(
      (links ?? [])
        .map((row) => row.course_id)
        .filter((id): id is number => typeof id === "number"),
    ),
  ];
  if (courseIds.length === 0) return [];

  const { data, error } = await db
    .from("courses")
    .select("id, title, status, visibility, organization_id, color_key")
    .in("id", courseIds)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .eq("visibility", "published");

  if (error) throw new Error(error.message);

  return (data ?? []).map((course) => ({
    id: course.id,
    title: course.title,
    status: course.status,
    colorKey: course.color_key,
  }));
}

async function loadDashboardForStudentIds(
  organizationId: number,
  userId: string,
  studentIds: number[],
  options?: ParentDashboardLoadOptions,
): Promise<ParentDashboard> {
  const db = requireSupabase();
  const week = resolveDashboardWeek(options);
  const today = localIsoDate();

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
  const materials = await loadPublishedMaterialsForCourses(courseIds);
  const importantNow = mapImportantNow(importantResult.data ?? []);
  const lessonPlans = await loadPublishedLessonPlansForCourses(
    organizationId,
    week,
    courseIds,
  );
  const classMemberships = (membersResult.data ?? []).map((row) => ({
    classId: row.class_id,
    studentId: row.student_profile_id,
  }));
  const announcements = await mapAnnouncements(
    organizationId,
    userId,
    announcementsResult.data ?? [],
  );
  const eventRows = await listEventsOverlapping(organizationId, week.start, week.end);

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
    events: eventRows.map((event) => ({
      id: event.id,
      title: event.title,
      location: event.location,
      startsOn: event.startsOn,
      endsOn: event.endsOn,
      startTime: event.startTime,
      endTime: event.endTime,
      audience: event.audience,
      courseIds: event.courseIds,
      classIds: event.classIds,
    })),
  });
}

export async function loadParentDashboard(
  organizationId: number,
  userId: string,
  options?: ParentDashboardLoadOptions,
): Promise<ParentDashboard> {
  const studentIds = await loadFamilyStudentIds(organizationId, userId);
  return loadDashboardForStudentIds(organizationId, userId, studentIds, options);
}

export async function loadParentLinkedDashboard(
  organizationId: number,
  userId: string,
  options?: ParentDashboardLoadOptions,
): Promise<ParentDashboard> {
  const studentIds = await loadLinkedParentStudentIds(userId);
  return loadDashboardForStudentIds(organizationId, userId, studentIds, options);
}

export async function loadOwnStudentDashboard(
  organizationId: number,
  userId: string,
  options?: ParentDashboardLoadOptions,
): Promise<ParentDashboard> {
  const studentIds = await loadOwnStudentProfileIds(organizationId, userId);
  return loadDashboardForStudentIds(organizationId, userId, studentIds, options);
}

export async function loadInstructorPreviewDashboard(
  organizationId: number,
  userId: string,
  studentName = "Preview",
  options?: ParentDashboardLoadOptions,
): Promise<ParentDashboard> {
  const week = resolveDashboardWeek(options);
  const today = localIsoDate();
  const courses = await listTaughtPublishedCourses(organizationId, userId);

  if (courses.length === 0) {
    return buildParentDashboard(
      buildInstructorPreviewSource({
        week,
        today,
        studentName,
        courses: [],
        materials: [],
        importantNow: [],
        lessonPlans: [],
        announcements: [],
        events: [],
      }),
    );
  }

  const db = requireSupabase();
  const courseIds = courses.map((course) => course.id);

  const [importantResult, announcementsResult] = await Promise.all([
    db
      .from("important_now")
      .select(
        "id, material_id, course_id, material:materials(title, description, unit_id), course:courses(title)",
      )
      .eq("organization_id", organizationId)
      .in("course_id", courseIds),
    db
      .from("announcements")
      .select(
        "id, title, body, start_date, end_date, created_at, created_by, audience, course_ids, class_ids, student_profile_ids, author:profiles!announcements_created_by_fkey(name), announcement_reads(user_id)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("announcement_reads.user_id", userId),
  ]);

  if (importantResult.error) throw new Error(importantResult.error.message);
  if (announcementsResult.error) throw new Error(announcementsResult.error.message);

  const materials = await loadPublishedMaterialsForCourses(courseIds);
  const importantNow = mapImportantNow(importantResult.data ?? []);
  const lessonPlans = await loadPublishedLessonPlansForCourses(
    organizationId,
    week,
    courseIds,
  );
  const announcements = await mapAnnouncements(
    organizationId,
    userId,
    announcementsResult.data ?? [],
  );
  const eventRows = await listEventsOverlapping(organizationId, week.start, week.end);

  return buildParentDashboard(
    buildInstructorPreviewSource({
      week,
      today,
      studentName,
      courses,
      materials,
      importantNow,
      lessonPlans,
      announcements,
      events: eventRows.map((event) => ({
        id: event.id,
        title: event.title,
        location: event.location,
        startsOn: event.startsOn,
        endsOn: event.endsOn,
        startTime: event.startTime,
        endTime: event.endTime,
        audience: event.audience,
        courseIds: event.courseIds,
        classIds: event.classIds,
      })),
    }),
  );
}

async function loadPublishedMaterialsForCourses(
  courseIds: number[],
): Promise<ParentDashboardSource["materials"]> {
  if (courseIds.length === 0) return [];
  const db = requireSupabase();

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

  let materials: ParentDashboardSource["materials"] = (materialsResult.data ?? []).flatMap(
    (row) => {
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
          itemKind: "material" as const,
        },
      ];
    },
  );

  const quizzesResult = await db
    .from("quizzes")
    .select(
      "id, title, accepts_from, accepts_until, accepts_timezone, course_id, unit_id, deleted_at, visibility, share_answer_key_with_parents",
    )
    .in("course_id", courseIds)
    .is("deleted_at", null)
    .eq("visibility", "published");
  if (quizzesResult.error) throw new Error(quizzesResult.error.message);
  materials = [
    ...materials,
    ...(quizzesResult.data ?? []).flatMap((row) => [
      {
        id: row.id,
        title: row.title,
        scheduledDate: quizAssignedDate(row.accepts_from, row.accepts_timezone),
        dueDate: quizDueDate(row.accepts_until, row.accepts_timezone),
        courseId: row.course_id,
        unitId: row.unit_id,
        unitStart: null,
        unitEnd: null,
        itemKind: "quiz" as const,
        shareAnswerKeyWithParents: row.share_answer_key_with_parents,
      },
    ]),
  ];

  return materials;
}

async function loadPublishedLessonPlansForCourses(
  organizationId: number,
  week: { start: string; end: string },
  courseIds: number[],
) {
  const plans = await listLessonPlansInRange(organizationId, week.start, week.end);
  return plans
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
}

function mapImportantNow(
  rows: Array<{
    id: number;
    material_id: number;
    course_id: number;
    material:
      | { title: string; description: string; unit_id: number | null }
      | { title: string; description: string; unit_id: number | null }[]
      | null;
    course: { title: string } | { title: string }[] | null;
  }>,
): ParentDashboardSource["importantNow"] {
  return rows.flatMap((row) => {
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

async function mapAnnouncements(
  organizationId: number,
  userId: string,
  rows: Array<{
    id: number;
    title: string;
    body: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    audience: string;
    course_ids: number[] | null;
    class_ids: number[] | null;
    student_profile_ids: number[] | null;
    author: { name: string } | { name: string }[] | null;
    announcement_reads: Array<{ user_id: string }> | null;
  }>,
): Promise<NonNullable<ParentDashboardSource["announcements"]>> {
  const db = requireSupabase();
  const announcementsRaw = rows.flatMap((row) => {
    const audience = parseAnnouncementAudience(row.audience);
    if (!audience) return [];
    const reads = Array.isArray(row.announcement_reads) ? row.announcement_reads : [];
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
          .eq("organization_id", organizationId)
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

  return announcementsRaw.map((row) => ({
    ...row,
    courseTitles: row.courseIds.map((id) => courseTitleById.get(id) ?? "Course"),
    classTitles: row.classIds.map((id) => classTitleById.get(id) ?? "Class"),
    studentNames: row.studentIds.map((id) => studentNameById.get(id) ?? "Student"),
  }));
}
