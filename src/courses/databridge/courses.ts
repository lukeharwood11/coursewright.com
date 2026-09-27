import {
  listAssignableOrgStaff,
  type AssignableOrgPerson,
} from "@/organizations/databridge/assignableStaff";
import { listOrgMemberNames } from "@/organizations/databridge/orgNames";
import { requireSupabase } from "./client";
import type { CourseSettingsInput, CreateCourseInput } from "@/courses/model/createCourse";
import { parseCourseStatus, type CourseStatus } from "@/courses/model/status";
import { parseCourseIconKey, type CourseIconValue } from "@/courses/model/courseIcon";
import {
  parseCourseColorKey,
  autoCourseColorKey,
  type CourseColorKey,
} from "@/courses/model/courseColor";
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
  iconKey: CourseIconValue;
  status: CourseStatus;
  visibility: CourseVisibility;
  startDate: string | null;
  endDate: string | null;
  gradeLevels: string[];
  copiedFromCourseId: number | null;
  colorKey: CourseColorKey;
};

export type CourseInstructor = {
  orgProfileId: number;
  userId: string | null;
  name: string;
  email: string;
};

export type CourseCatalogMeta = {
  instructors: CourseInstructor[];
  activeEnrollmentCount: number;
};

const COURSE_COLUMNS =
  "id, organization_id, title, description, location, subject, icon_key, status, visibility, start_date, end_date, grade_levels, copied_from_course_id, color_key";

export const courseQueryKeys = {
  list: (orgId: number) => ["courses", "list", orgId] as const,
  /** Course list page — includes roster meta; do not share cache with `list`. */
  listWithCatalog: (orgId: number) => ["courses", "listWithCatalog", orgId] as const,
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
  icon_key: string | null;
  status: string;
  visibility: string;
  start_date: string | null;
  end_date: string | null;
  grade_levels: string[];
  copied_from_course_id: number | null;
  color_key: string;
};

function toCourseSummary(row: CourseRow): CourseSummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description ?? "",
    location: row.location ?? "",
    subject: row.subject ?? "",
    iconKey: parseCourseIconKey(row.icon_key),
    status: parseCourseStatus(row.status),
    visibility: parseCourseVisibility(row.visibility),
    startDate: row.start_date,
    endDate: row.end_date,
    gradeLevels: row.grade_levels ?? [],
    copiedFromCourseId: row.copied_from_course_id,
    colorKey: parseCourseColorKey(row.color_key),
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
      icon_key: input.iconKey,
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
  const created = toCourseSummary(data);
  const colorKey = autoCourseColorKey(created.id);
  if (created.colorKey === colorKey) return created;
  const { data: painted, error: colorError } = await db
    .from("courses")
    .update({ color_key: colorKey })
    .eq("id", created.id)
    .select(COURSE_COLUMNS)
    .maybeSingle();
  if (colorError || !painted) return { ...created, colorKey };
  return toCourseSummary(painted);
}

export async function updateCourse(
  id: number,
  input: CourseSettingsInput,
): Promise<CourseSummary> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("courses")
    .update({
      title: input.title,
      description: input.description,
      location: input.location,
      subject: input.subject,
      icon_key: input.iconKey,
      start_date: input.startDate,
      end_date: input.endDate,
      grade_levels: input.gradeLevels,
      status: input.status,
      color_key: input.colorKey,
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

function toCourseInstructor(
  row: { org_profile_id: number; user_id: string | null },
  names: Map<number, { name: string; email: string }>,
): CourseInstructor | null {
  const person = names.get(row.org_profile_id);
  if (!person) return null;
  return {
    orgProfileId: row.org_profile_id,
    userId: row.user_id,
    name: person.name,
    email: person.email,
  };
}

export async function listCoursesCatalogMeta(
  courseIds: number[],
): Promise<Record<number, CourseCatalogMeta>> {
  const metaFor = (): CourseCatalogMeta => ({
    instructors: [],
    activeEnrollmentCount: 0,
  });
  const byCourseId: Record<number, CourseCatalogMeta> = {};
  for (const courseId of courseIds) {
    byCourseId[courseId] = metaFor();
  }
  if (courseIds.length === 0) return byCourseId;

  const db = requireSupabase();
  const [instructorResult, enrollmentResult, courseOrgs] = await Promise.all([
    db
      .from("course_instructors")
      .select("course_id, org_profile_id, user_id")
      .in("course_id", courseIds),
    db
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "active"),
    db.from("courses").select("id, organization_id").in("id", courseIds),
  ]);

  if (instructorResult.error) throw new Error(instructorResult.error.message);
  if (enrollmentResult.error) throw new Error(enrollmentResult.error.message);
  if (courseOrgs.error) throw new Error(courseOrgs.error.message);

  const orgByCourse = new Map<number, number>();
  for (const course of courseOrgs.data ?? []) {
    orgByCourse.set(course.id, course.organization_id);
  }
  const namesByOrg = new Map<number, Map<number, { name: string; email: string }>>();
  for (const orgId of new Set(orgByCourse.values())) {
    const names = await listOrgMemberNames(orgId);
    namesByOrg.set(orgId, new Map(names.map((person) => [person.id, person])));
  }

  const instructorsByCourse = new Map<number, CourseInstructor[]>();
  for (const row of instructorResult.data ?? []) {
    const courseId = row.course_id;
    if (typeof courseId !== "number") continue;
    const names = namesByOrg.get(orgByCourse.get(courseId) ?? -1);
    const person = names ? toCourseInstructor(row, names) : null;
    if (!person) continue;
    const list = instructorsByCourse.get(courseId) ?? [];
    list.push(person);
    instructorsByCourse.set(courseId, list);
  }

  for (const [courseId, instructors] of instructorsByCourse) {
    byCourseId[courseId] = {
      ...byCourseId[courseId],
      instructors,
    };
  }

  for (const row of enrollmentResult.data ?? []) {
    const courseId = row.course_id;
    if (typeof courseId !== "number") continue;
    byCourseId[courseId] = {
      ...byCourseId[courseId],
      activeEnrollmentCount: byCourseId[courseId].activeEnrollmentCount + 1,
    };
  }

  return byCourseId;
}

export async function listCourseInstructors(
  courseId: number,
): Promise<CourseInstructor[]> {
  const db = requireSupabase();
  const { data: course, error: courseError } = await db
    .from("courses")
    .select("organization_id")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) return [];

  const { data, error } = await db
    .from("course_instructors")
    .select("org_profile_id, user_id")
    .eq("course_id", courseId);
  if (error) throw new Error(error.message);

  const names = new Map(
    (await listOrgMemberNames(course.organization_id)).map((person) => [
      person.id,
      person,
    ]),
  );
  return (data ?? []).flatMap((row) => {
    const person = toCourseInstructor(row, names);
    return person ? [person] : [];
  });
}

export async function addCourseInstructor(
  courseId: number,
  orgProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("course_instructors").insert({
    course_id: courseId,
    org_profile_id: orgProfileId,
  });
  if (error) throw new Error(error.message);
}

export async function removeCourseInstructor(
  courseId: number,
  orgProfileId: number,
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("course_instructors")
    .delete()
    .eq("course_id", courseId)
    .eq("org_profile_id", orgProfileId);
  if (error) throw new Error(error.message);
}

export type OrgStaffPickerPerson = AssignableOrgPerson;

/** Staff names for the co-teacher picker — claimed and not-yet-claimed. */
export async function listOrgStaffForPicker(
  organizationId: number,
): Promise<OrgStaffPickerPerson[]> {
  return listAssignableOrgStaff(organizationId);
}

export async function copyCourseFromCourse(args: {
  sourceCourseId: number;
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
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
