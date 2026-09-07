import { requireSupabase } from "./client";
import type { CreateCourseInput } from "@/courses/model/createCourse";
import { parseCourseStatus, type CourseStatus } from "@/courses/model/status";
import {
  parseCourseVisibility,
  type CourseVisibility,
} from "@/courses/model/visibility";

export type CourseSummary = {
  id: number;
  organizationId: number;
  title: string;
  description: string;
  location: string;
  subject: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  startDate: string | null;
  endDate: string | null;
  gradeLevels: string[];
  copiedFromCourseId: number | null;
};

export type CourseInstructor = {
  userId: string;
  name: string;
  email: string;
};

const COURSE_COLUMNS =
  "id, organization_id, title, description, location, subject, status, visibility, start_date, end_date, grade_levels, copied_from_course_id";

export const courseQueryKeys = {
  list: (orgId: number) => ["courses", "list", orgId] as const,
  detail: (id: number) => ["courses", "detail", id] as const,
  instructors: (id: number) => ["courses", "instructors", id] as const,
};

type CourseRow = {
  id: number;
  organization_id: number;
  title: string;
  description: string;
  location: string;
  subject: string;
  status: string;
  visibility: string;
  start_date: string | null;
  end_date: string | null;
  grade_levels: string[];
  copied_from_course_id: number | null;
};

function toCourseSummary(row: CourseRow): CourseSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    subject: row.subject ?? "",
    status: parseCourseStatus(row.status),
    visibility: parseCourseVisibility(row.visibility),
    startDate: row.start_date,
    endDate: row.end_date,
    gradeLevels: row.grade_levels ?? [],
    copiedFromCourseId: row.copied_from_course_id,
  };
}

export async function listCourses(organizationId: number): Promise<CourseSummary[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("organization_id", organizationId)
    .order("title");

  if (error) throw new Error(error.message);
  return (data ?? []).map(toCourseSummary);
}

export async function getCourse(id: number): Promise<CourseSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toCourseSummary(data);
}

export async function createCourse(
  organizationId: number,
  input: CreateCourseInput,
): Promise<CourseSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .insert({
      organization_id: organizationId,
      title: input.title,
      description: input.description,
      location: input.location,
      subject: input.subject,
      start_date: input.startDate,
      end_date: input.endDate,
      grade_levels: input.gradeLevels,
      status: input.status,
      copied_from_course_id: input.copiedFromCourseId,
    })
    .select(COURSE_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error("The course was created but couldn’t be opened yet. Refresh and try again.");
  }
  return toCourseSummary(data);
}

export async function updateCourse(
  id: number,
  input: Omit<CreateCourseInput, "copiedFromCourseId">,
): Promise<CourseSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .update({
      title: input.title,
      description: input.description,
      location: input.location,
      subject: input.subject,
      start_date: input.startDate,
      end_date: input.endDate,
      grade_levels: input.gradeLevels,
      status: input.status,
    })
    .eq("id", id)
    .select(COURSE_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don’t have permission to change this course.");
  return toCourseSummary(data);
}

export async function updateCourseVisibility(
  id: number,
  visibility: CourseVisibility,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("courses").update({ visibility }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listCourseInstructors(
  courseId: number,
): Promise<CourseInstructor[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("course_instructors")
    .select("user_id, profile:profiles(name, email)")
    .eq("course_id", courseId);

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!profile) return [];
    return [
      {
        userId: row.user_id,
        name: profile.name || profile.email,
        email: profile.email,
      },
    ];
  });
}

export async function addCourseInstructor(
  courseId: number,
  userId: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("course_instructors").insert({
    course_id: courseId,
    user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export async function removeCourseInstructor(
  courseId: number,
  userId: string,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("course_instructors")
    .delete()
    .eq("course_id", courseId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export type OrgStaffMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

export async function listOrgStaff(organizationId: number): Promise<OrgStaffMember[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("user_id, role, profile:profiles(name, email)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("role", ["owner", "admin", "instructor"]);

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!profile || !row.user_id) return [];
    return [
      {
        userId: row.user_id,
        name: profile.name || profile.email,
        email: profile.email,
        role: row.role,
      },
    ];
  });
}

export async function copyCourseFromCourse(args: {
  sourceCourseId: number;
  title: string;
  description: string;
  location: string;
  subject: string;
  startDate: string | null;
  endDate: string | null;
  gradeLevels: string[];
  status: "active" | "archived";
}): Promise<{ courseId: number }> {
  const db = requireSupabase();
  const { data, error } = await db.functions.invoke("create-course-from-course", {
    body: args,
  });
  if (error) throw new Error(error.message || "Couldn’t copy that course.");
  const courseId =
    data && typeof data === "object" && "courseId" in data
      ? Number((data as { courseId: unknown }).courseId)
      : NaN;
  if (!Number.isFinite(courseId)) {
    throw new Error("The copy finished but the new course id was missing.");
  }
  return { courseId };
}
