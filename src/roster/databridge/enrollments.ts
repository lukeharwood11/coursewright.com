import { parseEnrollmentStatus } from "@/roster/model/enrollment";
import type { EnrollmentStatus } from "@/roster/model/enrollment";
import { rosterWriteErrorMessage } from "@/roster/model/studentProfile";
import { requireSupabase } from "./client";
import type { StudentSummary } from "./students";

export type EnrollmentRecord = {
  id: number;
  courseId: number;
  studentProfileId: number;
  status: EnrollmentStatus;
};

export type CourseEnrollment = EnrollmentRecord & {
  student: StudentSummary;
};

export type StudentEnrollment = EnrollmentRecord & {
  courseTitle: string;
  courseStatus: string;
};

export const enrollmentQueryKeys = {
  course: (courseId: number) => ["enrollments", "course", courseId] as const,
  byStudent: (studentId: number) => ["enrollments", "student", studentId] as const,
};

type EnrollmentRow = {
  id: number;
  course_id: number;
  student_profile_id: number;
  status: string;
};

function toEnrollment(row: EnrollmentRow): EnrollmentRecord | null {
  const status = parseEnrollmentStatus(row.status);
  if (!status) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    studentProfileId: row.student_profile_id,
    status,
  };
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listCourseEnrollments(
  courseId: number,
): Promise<CourseEnrollment[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("enrollments")
    .select(
      "id, course_id, student_profile_id, status, student:student_profiles(id, organization_id, name, grade_level, parent_email)",
    )
    .eq("course_id", courseId)
    .eq("status", "active")
    .order("enrolled_at");

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const enrollment = toEnrollment(row);
    const studentRow = unwrapOne(row.student);
    if (!enrollment || !studentRow) return [];
    return [
      {
        ...enrollment,
        student: {
          id: studentRow.id,
          organizationId: studentRow.organization_id,
          name: studentRow.name,
          gradeLevel: studentRow.grade_level,
          parentEmail: studentRow.parent_email,
        },
      },
    ];
  });
}

export async function listStudentEnrollments(
  studentProfileId: number,
): Promise<StudentEnrollment[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("enrollments")
    .select("id, course_id, student_profile_id, status, course:courses(title, status)")
    .eq("student_profile_id", studentProfileId)
    .order("enrolled_at");

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const enrollment = toEnrollment(row);
    const course = unwrapOne(row.course);
    if (!enrollment || !course) return [];
    return [
      {
        ...enrollment,
        courseTitle: course.title,
        courseStatus: course.status,
      },
    ];
  });
}

export async function enrollStudent(
  courseId: number,
  studentProfileId: number,
): Promise<EnrollmentRecord> {
  const results = await enrollStudents(courseId, [studentProfileId]);
  const enrollment = results[0];
  if (!enrollment) {
    throw new Error("You don’t have permission to enroll this student.");
  }
  return enrollment;
}

export async function enrollStudents(
  courseId: number,
  studentProfileIds: number[],
): Promise<EnrollmentRecord[]> {
  const uniqueIds = [
    ...new Set(studentProfileIds.filter((id) => Number.isFinite(id) && id > 0)),
  ];
  if (uniqueIds.length === 0) return [];

  const db = requireSupabase();
  const { data: existingRows, error: existingError } = await db
    .from("enrollments")
    .select("id, course_id, student_profile_id, status")
    .eq("course_id", courseId)
    .in("student_profile_id", uniqueIds);

  if (existingError) throw new Error(rosterWriteErrorMessage(existingError));

  const existingByStudent = new Map(
    (existingRows ?? []).map((row) => [row.student_profile_id, row]),
  );
  const toReactivate = (existingRows ?? [])
    .filter((row) => row.status !== "active")
    .map((row) => row.id);
  const toInsert = uniqueIds.filter((id) => !existingByStudent.has(id));

  const results: EnrollmentRecord[] = [];

  for (const row of existingRows ?? []) {
    if (row.status === "active") {
      const enrollment = toEnrollment(row);
      if (enrollment) results.push(enrollment);
    }
  }

  if (toReactivate.length > 0) {
    const { data, error } = await db
      .from("enrollments")
      .update({ status: "active" })
      .in("id", toReactivate)
      .select("id, course_id, student_profile_id, status");

    if (error) throw new Error(rosterWriteErrorMessage(error));
    for (const row of data ?? []) {
      const enrollment = toEnrollment(row);
      if (enrollment) results.push(enrollment);
    }
    if ((data ?? []).length === 0) {
      throw new Error("You don’t have permission to update this enrollment.");
    }
  }

  if (toInsert.length > 0) {
    const { data, error } = await db
      .from("enrollments")
      .insert(
        toInsert.map((studentProfileId) => ({
          course_id: courseId,
          student_profile_id: studentProfileId,
          status: "active",
        })),
      )
      .select("id, course_id, student_profile_id, status");

    if (error) throw new Error(rosterWriteErrorMessage(error));
    for (const row of data ?? []) {
      const enrollment = toEnrollment(row);
      if (enrollment) results.push(enrollment);
    }
    if ((data ?? []).length === 0) {
      throw new Error("You don’t have permission to enroll this student.");
    }
  }

  return results;
}

export async function addStudentToCourse(args: {
  organizationId: number;
  courseId: number;
  name: string;
  parentEmail: string | null;
  gradeLevel: string | null;
}): Promise<void> {
  const db = requireSupabase();
  const { data: student, error: studentError } = await db
    .from("student_profiles")
    .insert({
      organization_id: args.organizationId,
      name: args.name,
      parent_email: args.parentEmail,
      grade_level: args.gradeLevel,
      created_via_course_id: args.courseId,
    })
    .select("id")
    .maybeSingle();

  if (studentError) throw new Error(rosterWriteErrorMessage(studentError));
  if (!student) throw new Error("The student was added but couldn’t be enrolled yet.");

  await enrollStudent(args.courseId, student.id);
}

export async function unenrollStudent(enrollmentId: number): Promise<void> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("enrollments")
    .update({ status: "withdrawn" })
    .eq("id", enrollmentId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(rosterWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to unenroll this student.");
  }
}

export async function setEnrollmentStatus(
  enrollmentId: number,
  status: "active" | "withdrawn",
): Promise<void> {
  if (status === "withdrawn") {
    await unenrollStudent(enrollmentId);
    return;
  }
  const db = requireSupabase();
  const { error } = await db
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);
  if (error) throw new Error(error.message);
}
