import { useQuery } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { loadStudentCourseGrades, gradebookQueryKeys } from "@/grading/databridge/gradebook";
import { listStudentReportCards, reportCardQueryKeys } from "@/grading/databridge/reportCards";
import { getGradingScale, gradingScaleQueryKeys } from "@/grading/databridge/scales";
import { requireSupabase } from "@/grading/databridge/client";
import { STUDENT_COLUMNS, toStudentSummary, type StudentSummary } from "@/roster/databridge/students";
import { listClassesForStudent, classQueryKeys } from "@/roster/databridge/classes";

async function getOwnStudent(organizationId: number, userId: string): Promise<StudentSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("student_profiles")
    .select(STUDENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toStudentSummary(data) : null;
}

export function useProgress() {
  const user = useAuthedUser();
  const { organization } = useOrgShell();
  const profileQuery = useQuery({
    queryKey: ["progress-student", organization.id, user.id],
    queryFn: () => getOwnStudent(organization.id, user.id),
  });
  const studentId = profileQuery.data?.id;
  const gradesQuery = useQuery({
    queryKey: gradebookQueryKeys.student(studentId ?? 0),
    queryFn: () => loadStudentCourseGrades(studentId!),
    enabled: studentId != null,
  });
  const classesQuery = useQuery({
    queryKey: classQueryKeys.forStudent(studentId ?? 0),
    queryFn: () => listClassesForStudent(studentId!),
    enabled: studentId != null,
  });
  const cardsQuery = useQuery({
    queryKey: reportCardQueryKeys.student(studentId ?? 0),
    queryFn: () => listStudentReportCards(studentId!),
    enabled: studentId != null,
  });
  const scaleQuery = useQuery({
    queryKey: gradingScaleQueryKeys.org(organization.id),
    queryFn: () => getGradingScale(organization.id),
  });

  return {
    organization,
    loading: profileQuery.isLoading,
    student: profileQuery.data ?? null,
    grades: gradesQuery.data ?? [],
    classes: classesQuery.data ?? [],
    cards: (cardsQuery.data ?? []).filter((card) => card.status === "sent"),
    scale: scaleQuery.data,
  };
}
