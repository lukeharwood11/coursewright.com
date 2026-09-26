import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { buildQuizPrintKeySearch, parseQuizPrintKeySearch } from "@/print/model/paths";
import { loadQuizPrintPacket } from "@/print/databridge/packets";
import {
  defaultQuizKeyPrintMode,
  quizKeyModeForQuiz,
  type QuizKeyPrintMode,
} from "@/print/model/quizKeyPrintMode";
import { accountIsStudentOnCourse, canShowAnswerKey } from "@/quizzes/model/quiz";

export function useQuizPrintOptions(quizId: number | null) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthedUser();
  const { parentPresentation } = useOrgShell();
  const urlMode = useMemo(
    () => parseQuizPrintKeySearch(location.search),
    [location.search],
  );

  const metaQuery = useQuery({
    queryKey: ["print-quiz-meta", quizId, user.id],
    enabled: quizId != null && Number.isFinite(quizId),
    queryFn: async () => {
      if (quizId == null) return null;
      return loadQuizPrintPacket({ quizId, userId: user.id });
    },
    retry: false,
  });

  const canShowKey = useMemo(() => {
    const meta = metaQuery.data;
    if (!meta) return false;
    const viewerIsStudent = accountIsStudentOnCourse(user.email, meta.linkedStudents);
    return canShowAnswerKey({
      teacherView: !parentPresentation,
      shareWithParents: meta.shareAnswerKeyWithParents,
      viewerIsStudent,
    });
  }, [metaQuery.data, parentPresentation, user.email]);

  const mode = useMemo(() => {
    if (!quizId || !canShowKey) return defaultQuizKeyPrintMode(false);
    return quizKeyModeForQuiz(
      quizId,
      urlMode ? new Map([[quizId, urlMode]]) : new Map(),
      true,
    );
  }, [canShowKey, quizId, urlMode]);

  const setMode = useCallback(
    (next: QuizKeyPrintMode) => {
      if (!canShowKey) return;
      const search = buildQuizPrintKeySearch(next);
      navigate({ pathname: location.pathname, search }, { replace: true });
    },
    [canShowKey, location.pathname, navigate],
  );

  return {
    loading: metaQuery.isPending,
    canShowKey,
    mode,
    setMode,
  };
}
