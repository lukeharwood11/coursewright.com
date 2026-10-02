import {
  parseDayStatus,
  parseSheetStatus,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { requireSupabase } from "./client";

export const attendanceQueryKeys = {
  all: ["attendance"] as const,
  classDate: (classId: number, onDate: string) =>
    ["attendance", "class", classId, onDate] as const,
  courseDate: (courseId: number, onDate: string) =>
    ["attendance", "course", courseId, onDate] as const,
  student: (studentId: number, from: string, to: string) =>
    ["attendance", "student", studentId, from, to] as const,
  dayWrite: (studentId: number, userId: string) =>
    ["attendance", "day-write", studentId, userId] as const,
};

export type NamedSheetStatus = {
  studentId: number;
  name: string;
  status: SheetStatus;
};

export type DayMark = {
  studentId: number;
  status: DayStatus;
  recordedBy: string | null;
};

export type OtherSheetMark = {
  studentId: number;
  kind: "class" | "course";
  sheetId: number;
  title: string;
  status: SheetStatus;
};

export type CohortCourseEnrollment = {
  studentId: number;
  courseId: number;
  title: string;
};

export type CourseInstructorRef = {
  courseId: number;
  userId: string | null;
};

export type DateSheetLoad = {
  entries: NamedSheetStatus[];
  days: DayMark[];
  others: OtherSheetMark[];
};

export type StudentAttendanceLoad = {
  days: { onDate: string; status: DayStatus }[];
  marks: { onDate: string; title: string; status: SheetStatus }[];
};

type StudentName = { id: number; name: string };
type TitleRow = { title: string };

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function uniqueIds(ids: number[]): number[] {
  return [...new Set(ids)];
}

export async function loadClassDateMarks(input: {
  classId: number;
  onDate: string;
  memberIds: number[];
}): Promise<DateSheetLoad> {
  const db = requireSupabase();
  const { data: entryRows, error: entryError } = await db
    .from("attendance_class_entries")
    .select("student_profile_id, status, student:org_profiles(id, name)")
    .eq("class_id", input.classId)
    .eq("on_date", input.onDate);
  if (entryError) throw new Error(entryError.message);

  const entries: NamedSheetStatus[] = [];
  for (const row of entryRows ?? []) {
    const status = parseSheetStatus(row.status);
    const student = unwrapOne(row.student as StudentName | StudentName[] | null);
    if (!status || !student) continue;
    entries.push({
      studentId: row.student_profile_id,
      name: student.name,
      status,
    });
  }

  const studentIds = uniqueIds([
    ...input.memberIds,
    ...entries.map((entry) => entry.studentId),
  ]);
  const context = await loadDateContext({
    studentIds,
    onDate: input.onDate,
    skipClassId: input.classId,
  });
  return { entries, days: context.days, others: context.others };
}

export async function loadCourseDateMarks(input: {
  courseId: number;
  onDate: string;
  enrolledIds: number[];
}): Promise<DateSheetLoad> {
  const db = requireSupabase();
  const { data: entryRows, error: entryError } = await db
    .from("attendance_course_entries")
    .select("student_profile_id, status, student:org_profiles(id, name)")
    .eq("course_id", input.courseId)
    .eq("on_date", input.onDate);
  if (entryError) throw new Error(entryError.message);

  const entries: NamedSheetStatus[] = [];
  for (const row of entryRows ?? []) {
    const status = parseSheetStatus(row.status);
    const student = unwrapOne(row.student as StudentName | StudentName[] | null);
    if (!status || !student) continue;
    entries.push({
      studentId: row.student_profile_id,
      name: student.name,
      status,
    });
  }

  const studentIds = uniqueIds([
    ...input.enrolledIds,
    ...entries.map((entry) => entry.studentId),
  ]);
  const context = await loadDateContext({
    studentIds,
    onDate: input.onDate,
    skipCourseId: input.courseId,
  });
  return { entries, days: context.days, others: context.others };
}

async function loadDateContext(input: {
  studentIds: number[];
  onDate: string;
  skipClassId?: number;
  skipCourseId?: number;
}): Promise<{ days: DayMark[]; others: OtherSheetMark[] }> {
  if (input.studentIds.length === 0) return { days: [], others: [] };
  const db = requireSupabase();

  const daysQuery = db
    .from("attendance_days")
    .select("student_profile_id, status, recorded_by")
    .eq("on_date", input.onDate)
    .in("student_profile_id", input.studentIds);

  let classQuery = db
    .from("attendance_class_entries")
    .select("class_id, student_profile_id, status, class:classes(title)")
    .eq("on_date", input.onDate)
    .in("student_profile_id", input.studentIds);
  if (input.skipClassId != null) {
    classQuery = classQuery.neq("class_id", input.skipClassId);
  }

  let courseQuery = db
    .from("attendance_course_entries")
    .select("course_id, student_profile_id, status, course:courses(title)")
    .eq("on_date", input.onDate)
    .in("student_profile_id", input.studentIds);
  if (input.skipCourseId != null) {
    courseQuery = courseQuery.neq("course_id", input.skipCourseId);
  }

  const [daysResult, classResult, courseResult] = await Promise.all([
    daysQuery,
    classQuery,
    courseQuery,
  ]);
  if (daysResult.error) throw new Error(daysResult.error.message);
  if (classResult.error) throw new Error(classResult.error.message);
  if (courseResult.error) throw new Error(courseResult.error.message);

  const days: DayMark[] = [];
  for (const row of daysResult.data ?? []) {
    const status = parseDayStatus(row.status);
    if (!status) continue;
    days.push({
      studentId: row.student_profile_id,
      status,
      recordedBy: row.recorded_by,
    });
  }

  const others: OtherSheetMark[] = [];
  for (const row of classResult.data ?? []) {
    const status = parseSheetStatus(row.status);
    const classRow = unwrapOne(row.class as TitleRow | TitleRow[] | null);
    if (!status || !classRow) continue;
    others.push({
      studentId: row.student_profile_id,
      kind: "class",
      sheetId: row.class_id,
      title: classRow.title,
      status,
    });
  }
  for (const row of courseResult.data ?? []) {
    const status = parseSheetStatus(row.status);
    const courseRow = unwrapOne(row.course as TitleRow | TitleRow[] | null);
    if (!status || !courseRow) continue;
    others.push({
      studentId: row.student_profile_id,
      kind: "course",
      sheetId: row.course_id,
      title: courseRow.title,
      status,
    });
  }
  return { days, others };
}

export async function loadClassCohortCourses(memberIds: number[]): Promise<{
  enrollments: CohortCourseEnrollment[];
  instructors: CourseInstructorRef[];
}> {
  if (memberIds.length === 0) return { enrollments: [], instructors: [] };
  const db = requireSupabase();
  const { data, error } = await db
    .from("enrollments")
    .select("student_profile_id, course_id, course:courses(id, title)")
    .in("student_profile_id", memberIds)
    .eq("status", "active");
  if (error) throw new Error(error.message);

  const enrollments: CohortCourseEnrollment[] = [];
  for (const row of data ?? []) {
    const course = unwrapOne(row.course as TitleRow | TitleRow[] | null);
    if (!course || row.course_id == null) continue;
    enrollments.push({
      studentId: row.student_profile_id,
      courseId: row.course_id,
      title: course.title,
    });
  }

  const courseIds = uniqueIds(enrollments.map((row) => row.courseId));
  if (courseIds.length === 0) return { enrollments, instructors: [] };

  const { data: instructorRows, error: instructorError } = await db
    .from("course_instructors")
    .select("course_id, user_id")
    .in("course_id", courseIds);
  if (instructorError) throw new Error(instructorError.message);

  const instructors: CourseInstructorRef[] = (instructorRows ?? []).map((row) => ({
    courseId: row.course_id,
    userId: row.user_id,
  }));
  return { enrollments, instructors };
}

export async function loadStudentAttendance(
  studentId: number,
  from: string,
  to: string,
): Promise<StudentAttendanceLoad> {
  const db = requireSupabase();
  const [daysResult, classResult, courseResult] = await Promise.all([
    db
      .from("attendance_days")
      .select("on_date, status")
      .eq("student_profile_id", studentId)
      .gte("on_date", from)
      .lte("on_date", to),
    db
      .from("attendance_class_entries")
      .select("on_date, status, class:classes(title)")
      .eq("student_profile_id", studentId)
      .gte("on_date", from)
      .lte("on_date", to),
    db
      .from("attendance_course_entries")
      .select("on_date, status, course:courses(title)")
      .eq("student_profile_id", studentId)
      .gte("on_date", from)
      .lte("on_date", to),
  ]);
  if (daysResult.error) throw new Error(daysResult.error.message);
  if (classResult.error) throw new Error(classResult.error.message);
  if (courseResult.error) throw new Error(courseResult.error.message);

  const days: StudentAttendanceLoad["days"] = [];
  for (const row of daysResult.data ?? []) {
    const status = parseDayStatus(row.status);
    if (!status) continue;
    days.push({ onDate: row.on_date, status });
  }

  const marks: StudentAttendanceLoad["marks"] = [];
  for (const row of classResult.data ?? []) {
    const status = parseSheetStatus(row.status);
    const classRow = unwrapOne(row.class as TitleRow | TitleRow[] | null);
    if (!status || !classRow) continue;
    marks.push({ onDate: row.on_date, title: classRow.title, status });
  }
  for (const row of courseResult.data ?? []) {
    const status = parseSheetStatus(row.status);
    const courseRow = unwrapOne(row.course as TitleRow | TitleRow[] | null);
    if (!status || !courseRow) continue;
    marks.push({ onDate: row.on_date, title: courseRow.title, status });
  }
  return { days, marks };
}

export async function loadDayWriteFlags(
  studentId: number,
  userId: string,
): Promise<{ leadsCurrentClass: boolean; teachesActiveEnrollment: boolean }> {
  const db = requireSupabase();
  const { data: memberships, error: memberError } = await db
    .from("class_members")
    .select("class_id")
    .eq("student_profile_id", studentId);
  if (memberError) throw new Error(memberError.message);
  const classIds = (memberships ?? []).map((row) => row.class_id);

  let leadsCurrentClass = false;
  if (classIds.length > 0) {
    const { data: leads, error } = await db
      .from("class_leaders")
      .select("class_id")
      .in("class_id", classIds)
      .eq("user_id", userId)
      .limit(1);
    if (error) throw new Error(error.message);
    leadsCurrentClass = (leads ?? []).length > 0;
  }

  const { data: enrollments, error: enrollError } = await db
    .from("enrollments")
    .select("course_id")
    .eq("student_profile_id", studentId)
    .eq("status", "active");
  if (enrollError) throw new Error(enrollError.message);
  const courseIds = (enrollments ?? []).map((row) => row.course_id);

  let teachesActiveEnrollment = false;
  if (courseIds.length > 0) {
    const { data: teaching, error } = await db
      .from("course_instructors")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("user_id", userId)
      .limit(1);
    if (error) throw new Error(error.message);
    teachesActiveEnrollment = (teaching ?? []).length > 0;
  }

  return { leadsCurrentClass, teachesActiveEnrollment };
}

export async function upsertClassEntry(input: {
  organizationId: number;
  classId: number;
  studentProfileId: number;
  onDate: string;
  status: SheetStatus;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("attendance_class_entries").upsert(
    {
      organization_id: input.organizationId,
      class_id: input.classId,
      student_profile_id: input.studentProfileId,
      on_date: input.onDate,
      status: input.status,
    },
    { onConflict: "class_id,student_profile_id,on_date" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteClassEntry(input: {
  classId: number;
  studentProfileId: number;
  onDate: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("attendance_class_entries")
    .delete()
    .eq("class_id", input.classId)
    .eq("student_profile_id", input.studentProfileId)
    .eq("on_date", input.onDate);
  if (error) throw new Error(error.message);
}

export async function upsertCourseEntry(input: {
  organizationId: number;
  courseId: number;
  studentProfileId: number;
  onDate: string;
  status: SheetStatus;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("attendance_course_entries").upsert(
    {
      organization_id: input.organizationId,
      course_id: input.courseId,
      student_profile_id: input.studentProfileId,
      on_date: input.onDate,
      status: input.status,
    },
    { onConflict: "course_id,student_profile_id,on_date" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteCourseEntry(input: {
  courseId: number;
  studentProfileId: number;
  onDate: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("attendance_course_entries")
    .delete()
    .eq("course_id", input.courseId)
    .eq("student_profile_id", input.studentProfileId)
    .eq("on_date", input.onDate);
  if (error) throw new Error(error.message);
}

export async function upsertDay(input: {
  organizationId: number;
  studentProfileId: number;
  onDate: string;
  status: DayStatus;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("attendance_days").upsert(
    {
      organization_id: input.organizationId,
      student_profile_id: input.studentProfileId,
      on_date: input.onDate,
      status: input.status,
    },
    { onConflict: "student_profile_id,on_date" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteDay(input: {
  studentProfileId: number;
  onDate: string;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("attendance_days")
    .delete()
    .eq("student_profile_id", input.studentProfileId)
    .eq("on_date", input.onDate);
  if (error) throw new Error(error.message);
}
