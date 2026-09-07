import { requireSupabase } from "./client";

export type CourseEnrollment = {
  id: number;
  studentId: number;
  name: string;
  gradeLevel: string | null;
  parentEmail: string | null;
  status: string;
};

export const enrollmentQueryKeys = {
  course: (courseId: number) => ["enrollments", "course", courseId] as const,
};

export async function listCourseEnrollments(
  courseId: number,
): Promise<CourseEnrollment[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("enrollments")
    .select(
      "id, status, student:student_profiles(id, name, grade_level, parent_email)",
    )
    .eq("course_id", courseId)
    .order("enrolled_at");

  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;
    if (!student) return [];
    return [
      {
        id: row.id,
        studentId: student.id,
        name: student.name,
        gradeLevel: student.grade_level,
        parentEmail: student.parent_email,
        status: row.status,
      },
    ];
  });
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

  if (studentError) throw new Error(studentError.message);
  if (!student) throw new Error("The student was added but couldn’t be enrolled yet.");

  const { error: enrollError } = await db.from("enrollments").insert({
    student_profile_id: student.id,
    course_id: args.courseId,
    status: "active",
  });
  if (enrollError) throw new Error(enrollError.message);
}

export async function setEnrollmentStatus(
  enrollmentId: number,
  status: "active" | "withdrawn",
): Promise<void> {
  const db = requireSupabase();
  const { error } = await db
    .from("enrollments")
    .update({ status })
    .eq("id", enrollmentId);
  if (error) throw new Error(error.message);
}
