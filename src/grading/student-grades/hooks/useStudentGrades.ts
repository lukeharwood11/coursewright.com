import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { gradebookQueryKeys, loadStudentCourseGrades } from "@/grading/databridge/gradebook";
import {
  generateReportCard,
  listStudentReportCards,
  reportCardQueryKeys,
} from "@/grading/databridge/reportCards";
import { getGradingScale, gradingScaleQueryKeys } from "@/grading/databridge/scales";
import { reportCardPath } from "@/grading/model/paths";
import { toastCaughtError } from "@/ui/toast";

export function useStudentGrades(studentId: number | null) {
  const { organization, role, parentPresentation } = useOrgShell();
  const canAct = staffCanEdit(role, parentPresentation);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ready = studentId != null;

  const scaleQuery = useQuery({
    queryKey: gradingScaleQueryKeys.org(organization.id),
    queryFn: () => getGradingScale(organization.id),
  });
  const gradesQuery = useQuery({
    queryKey: gradebookQueryKeys.student(studentId ?? 0),
    queryFn: () => loadStudentCourseGrades(studentId!),
    enabled: ready,
  });
  const cardsQuery = useQuery({
    queryKey: reportCardQueryKeys.student(studentId ?? 0),
    queryFn: () => listStudentReportCards(studentId!),
    enabled: ready && canAct,
  });

  const generate = useMutation({
    mutationFn: (enrollmentId: number) => generateReportCard(enrollmentId),
    onSuccess: async (cardId) => {
      await queryClient.invalidateQueries({
        queryKey: reportCardQueryKeys.student(studentId ?? 0),
      });
      navigate(reportCardPath(organization.slug, cardId));
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  return {
    organization,
    canAct,
    scale: scaleQuery.data,
    grades: gradesQuery.data ?? [],
    cards: cardsQuery.data ?? [],
    generatingEnrollmentId: generate.isPending ? generate.variables : null,
    generateForEnrollment: (enrollmentId: number) => generate.mutate(enrollmentId),
  };
}
