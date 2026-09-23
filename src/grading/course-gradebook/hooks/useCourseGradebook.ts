import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { getCourse, courseQueryKeys } from "@/courses/databridge/courses";
import {
  gradebookQueryKeys,
  listAttemptAnswerDrafts,
  listCourseQuizzes,
  loadCourseGradebook,
  saveAssignmentGrade,
  setCourseFinalOverride,
  type GradebookRow,
} from "@/grading/databridge/gradebook";
import {
  generateCourseReportCards,
  listCourseReportCards,
  reportCardQueryKeys,
} from "@/grading/databridge/reportCards";
import { getGradingScale, gradingScaleQueryKeys } from "@/grading/databridge/scales";
import { finalOverrideNeedsConfirm } from "@/grading/model/scale";
import { classQueryKeys, listClassMembers, listClasses } from "@/roster/databridge/classes";
import { caughtErrorMessage } from "@/ui/toast";

export function useCourseGradebook() {
  const { courseId: courseIdParam } = useParams();
  const courseId = courseIdParam ? Number(courseIdParam) : NaN;
  const ready = Number.isFinite(courseId);
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: ready,
  });
  const scaleQuery = useQuery({
    queryKey: gradingScaleQueryKeys.org(organization.id),
    queryFn: () => getGradingScale(organization.id),
  });
  const bookQuery = useQuery({
    queryKey: gradebookQueryKeys.course(courseId),
    queryFn: () => loadCourseGradebook(courseId),
    enabled: ready,
  });
  const quizzesQuery = useQuery({
    queryKey: ["gradebook-quizzes", courseId],
    queryFn: () => listCourseQuizzes(courseId),
    enabled: ready,
  });
  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organization.id),
    queryFn: () => listClasses(organization.id),
  });
  const membersQuery = useQuery({
    queryKey: classQueryKeys.members(classId ?? 0),
    queryFn: () => listClassMembers(classId!),
    enabled: classId != null,
  });
  const cardsQuery = useQuery({
    queryKey: reportCardQueryKeys.course(courseId),
    queryFn: () => listCourseReportCards(courseId),
    enabled: ready,
  });
  const answersQuery = useQuery({
    queryKey: gradebookQueryKeys.attempt(attemptId ?? 0),
    queryFn: () => listAttemptAnswerDrafts(attemptId!),
    enabled: attemptId != null,
  });

  const classStudentIds = useMemo(() => {
    if (classId == null) return null;
    return new Set((membersQuery.data ?? []).map((member) => member.student.id));
  }, [classId, membersQuery.data]);

  const rows = (bookQuery.data ?? []).filter((row) =>
    classStudentIds == null ? true : classStudentIds.has(row.studentProfileId),
  );

  const scale = scaleQuery.data;
  const bandsChanged = Boolean(
    scale &&
      rows.some((row) =>
        finalOverrideNeedsConfirm({
          overrideLabel: row.overrideLabel,
          overriddenAt: row.overriddenAt,
          scaleUpdatedAt: scale.updatedAt,
          scale,
        }),
      ),
  );

  async function refreshBook() {
    await queryClient.invalidateQueries({ queryKey: gradebookQueryKeys.course(courseId) });
    await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.course(courseId) });
  }

  const saveFinal = useMutation({
    mutationFn: (args: { enrollmentId: number; label: string | null; note: string }) =>
      setCourseFinalOverride(args),
    onSuccess: async () => {
      toast("Final saved.");
      await refreshBook();
    },
    onError: (error: Error) => toast(caughtErrorMessage(error)),
  });

  const savePoints = useMutation({
    mutationFn: (points: { questionId: number; points: number }[]) => {
      if (attemptId == null) throw new Error("Pick a quiz entry first.");
      return saveAssignmentGrade({ attemptId, points, note });
    },
    onSuccess: async () => {
      toast("Grade saved.");
      setAttemptId(null);
      setNote("");
      await refreshBook();
    },
    onError: (error: Error) => toast(caughtErrorMessage(error)),
  });

  const batch = useMutation({
    mutationFn: () => generateCourseReportCards(courseId),
    onSuccess: async (ids) => {
      toast(ids.length === 0 ? "No students to draft." : "Drafts are ready. Send them one at a time.");
      await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.course(courseId) });
    },
    onError: (error: Error) => toast(caughtErrorMessage(error)),
  });

  const needsGrade = rows.flatMap((row) =>
    row.items
      .filter((item) => !item.locked)
      .map((item) => ({
        attemptId: item.attemptId,
        studentName: row.studentName,
        title: item.title,
      })),
  );

  return {
    organization,
    course: courseQuery.data ?? null,
    loading: courseQuery.isLoading || bookQuery.isLoading,
    missing: ready && !courseQuery.isLoading && !courseQuery.data,
    scale,
    quizzes: quizzesQuery.data ?? [],
    rows,
    classes: classesQuery.data ?? [],
    classId,
    setClassId,
    bandsChanged,
    needsGrade,
    cards: cardsQuery.data ?? [],
    attemptId,
    openAttempt: (id: number) => {
      setAttemptId(id);
      setNote("");
    },
    closeAttempt: () => setAttemptId(null),
    answers: answersQuery.data ?? [],
    answersLoading: answersQuery.isLoading,
    note,
    setNote,
    savingPoints: savePoints.isPending,
    savePoints: (points: { questionId: number; points: number }[]) => savePoints.mutate(points),
    savingFinal: saveFinal.isPending,
    saveFinal: (row: GradebookRow, label: string | null, finalNote: string) =>
      saveFinal.mutate({ enrollmentId: row.enrollmentId, label, note: finalNote }),
    clearFinal: (row: GradebookRow) =>
      saveFinal.mutate({ enrollmentId: row.enrollmentId, label: null, note: "" }),
    drafting: batch.isPending,
    draftAll: () => batch.mutate(),
  };
}
