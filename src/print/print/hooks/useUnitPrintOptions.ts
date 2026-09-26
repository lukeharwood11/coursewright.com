import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { familyVisibleMaterials } from "@/app/layouts/model/viewMode";
import { parseUnitPrintSearch } from "@/print/model/paths";
import { serializeQuizKeyModeMap } from "@/print/model/quizKeyPrintMode";
import {
  defaultQuizKeyPrintMode,
  quizKeyModeForQuiz,
  type QuizKeyPrintMode,
} from "@/print/model/quizKeyPrintMode";
import {
  getQuiz,
  listLinkedStudents,
  listQuizzesForUnit,
} from "@/quizzes/databridge/quizzes";
import { accountIsStudentOnCourse, canShowAnswerKey } from "@/quizzes/model/quiz";

export type UnitPrintQuizOption = {
  quizId: number;
  title: string;
  canShowKey: boolean;
  mode: QuizKeyPrintMode;
};

export function useUnitPrintOptions(unitId: number | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthedUser();
  const { parentPresentation } = useOrgShell();
  const modes = useMemo(
    () => parseUnitPrintSearch(location.search),
    [location.search],
  );

  const quizzesQuery = useQuery({
    queryKey: ["print-unit-quizzes", unitId],
    enabled: unitId != null && Number.isFinite(unitId),
    queryFn: async () => {
      if (unitId == null) return [];
      const rows = parentPresentation
        ? familyVisibleMaterials(await listQuizzesForUnit(unitId))
        : await listQuizzesForUnit(unitId);
      const options: UnitPrintQuizOption[] = [];
      for (const row of rows) {
        const quiz = await getQuiz(row.id);
        if (!quiz) continue;
        const linkedStudents = await listLinkedStudents(quiz.courseId, user.id);
        const viewerIsStudent = accountIsStudentOnCourse(user.email, linkedStudents);
        const canShowKey = canShowAnswerKey({
          teacherView: !parentPresentation,
          shareWithParents: quiz.shareAnswerKeyWithParents,
          viewerIsStudent,
        });
        options.push({
          quizId: row.id,
          title: row.title,
          canShowKey,
          mode: quizKeyModeForQuiz(row.id, modes, canShowKey),
        });
      }
      return options;
    },
    retry: false,
  });

  const setQuizMode = useCallback(
    (quizId: number, mode: QuizKeyPrintMode) => {
      const next = new Map(modes);
      const row = quizzesQuery.data?.find((item) => item.quizId === quizId);
      if (!row?.canShowKey) return;
      if (mode === defaultQuizKeyPrintMode(true)) {
        next.delete(quizId);
      } else {
        next.set(quizId, mode);
      }
      const qid = serializeQuizKeyModeMap(next);
      const search = qid ? `?qid=${qid}` : "";
      navigate({ pathname: location.pathname, search }, { replace: true });
    },
    [location.pathname, modes, navigate, quizzesQuery.data],
  );

  const hasKeyOptions = Boolean(
    quizzesQuery.data?.some((row) => row.canShowKey),
  );

  return {
    loading: quizzesQuery.isPending,
    quizzes: quizzesQuery.data ?? [],
    hasKeyOptions,
    setQuizMode,
  };
}
