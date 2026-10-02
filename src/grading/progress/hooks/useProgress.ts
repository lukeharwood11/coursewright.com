import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { loadStudentCourseGrades, gradebookQueryKeys } from "@/grading/databridge/gradebook";
import { listStudentReportCards, reportCardQueryKeys } from "@/grading/databridge/reportCards";
import { getGradingScale, gradingScaleQueryKeys } from "@/grading/databridge/scales";
import { requireSupabase } from "@/grading/databridge/client";
import { loadLinkedParentStudentIds } from "@/parent/databridge/dashboard";
import { STUDENT_COLUMNS, getStudent, toStudentSummary, type StudentSummary } from "@/roster/databridge/students";
import { listClassesForStudent, classQueryKeys } from "@/roster/databridge/classes";

async function getOwnStudent(organizationId: number, userId: string): Promise<StudentSummary | null> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("org_profiles")
    .select(STUDENT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("counts_as_student", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toStudentSummary(data) : null;
}

async function linkedStudents(
  organizationId: number,
  userId: string,
): Promise<StudentSummary[]> {
  const ids = await loadLinkedParentStudentIds(userId);
  const students = await Promise.all(ids.map((id) => getStudent(id)));
  return students
    .flatMap((student) =>
      student && student.organizationId === organizationId ? [student] : [],
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function useProgress() {
  const user = useAuthedUser();
  const { organization, role } = useOrgShell();
  const [searchParams, setSearchParams] = useSearchParams();
  const parentViewer = role === "parent";
  const profileQuery = useQuery({
    queryKey: ["progress-student", organization.id, user.id],
    queryFn: () => getOwnStudent(organization.id, user.id),
    enabled: !parentViewer,
  });
  const linkedQuery = useQuery({
    queryKey: ["progress-linked", organization.id, user.id],
    queryFn: () => linkedStudents(organization.id, user.id),
    enabled: parentViewer,
  });
  const children = linkedQuery.data ?? [];
  const requestedId = Number(searchParams.get("student"));
  const student = parentViewer
    ? (children.find((child) => child.id === requestedId) ?? children[0] ?? null)
    : (profileQuery.data ?? null);
  const studentId = student?.id;
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

  function selectStudent(id: number) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("student", String(id));
        return next;
      },
      { replace: true },
    );
  }

  return {
    organization,
    parentViewer,
    children,
    selectStudent,
    loading: parentViewer ? linkedQuery.isLoading : profileQuery.isLoading,
    student,
    grades: gradesQuery.data ?? [],
    classes: classesQuery.data ?? [],
    cards: (cardsQuery.data ?? []).filter((card) => card.status === "sent"),
    scale: scaleQuery.data,
  };
}
