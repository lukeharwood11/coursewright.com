import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanManageCourse } from "@/courses/model/access";
import { courseQueryKeys, getCourse, listCourseInstructors } from "@/courses/databridge/courses";
import {
  getQuiz,
  listQuizQuestions,
  quizQueryKeys,
  saveQuizQuestions,
  updateQuiz,
  type QuizQuestionDraft,
} from "@/quizzes/databridge/quizzes";
import { quizPath } from "@/quizzes/model/paths";
import {
  emptyWindowFields,
  instantsFromWindowFields,
  viewerTimeZone,
  windowFieldsFromInstants,
  type WindowFields,
} from "@/quizzes/model/window";

function draftsFromQuestions(
  questions: Awaited<ReturnType<typeof listQuizQuestions>>,
): QuizQuestionDraft[] {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    kind: question.kind,
    answer: question.answer,
    choices: question.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
      correct: choice.correct,
    })),
    pairs: question.pairs.map((pair) => ({
      promptId: pair.promptId,
      optionId: pair.optionId,
      left: pair.left,
      right: pair.right,
    })),
    answerLines: question.answerLines ?? 4,
  }));
}

export function useQuizEdit() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : NaN;
  const quizId = params.quizId ? Number(params.quizId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const quizQuery = useQuery({
    queryKey: quizQueryKeys.detail(quizId),
    queryFn: () => getQuiz(quizId),
    enabled: Number.isFinite(quizId),
  });
  const questionsQuery = useQuery({
    queryKey: quizQueryKeys.questions(quizId),
    queryFn: () => listQuizQuestions(quizId),
    enabled: Number.isFinite(quizId),
  });
  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId),
  });
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: (instructorsQuery.data ?? []).map((row) => row.userId),
  });

  const quiz = quizQuery.data ?? null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [windowFields, setWindowFields] = useState<WindowFields>(emptyWindowFields());
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [autograde, setAutograde] = useState(false);
  const [shareKey, setShareKey] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!quiz || ready) return;
    const zone = viewerTimeZone(quiz.acceptsTimezone);
    setTitle(quiz.title);
    setDescription(quiz.description);
    setWindowFields(windowFieldsFromInstants(quiz.acceptsFrom, quiz.acceptsUntil, zone));
    setAllowMultiple(quiz.allowMultipleAttempts);
    setAutograde(quiz.autogradeAndShow);
    setShareKey(quiz.shareAnswerKeyWithParents);
    setQuestions(draftsFromQuestions(questionsQuery.data ?? []));
    if (!questionsQuery.isLoading) setReady(true);
  }, [quiz, questionsQuery.data, questionsQuery.isLoading, ready]);

  const viewPath = quizPath({
    orgSlug: organization.slug,
    courseId,
    unitId: Number.isFinite(unitId) ? unitId : quiz?.unitId ?? null,
    quizId,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error("We couldn’t find that quiz.");
      const trimmed = title.trim();
      if (!trimmed) throw new Error("Give the quiz a title.");
      const zone = viewerTimeZone(quiz.acceptsTimezone);
      const instants = instantsFromWindowFields(windowFields, zone);
      if (
        instants.acceptsFrom &&
        instants.acceptsUntil &&
        new Date(instants.acceptsUntil) <= new Date(instants.acceptsFrom)
      ) {
        throw new Error("The end time needs to be after the start time.");
      }
      await updateQuiz(quizId, {
        title: trimmed,
        description: description.trim(),
        acceptsFrom: instants.acceptsFrom,
        acceptsUntil: instants.acceptsUntil,
        acceptsTimezone: instants.acceptsFrom || instants.acceptsUntil ? zone : null,
        allowMultipleAttempts: allowMultiple,
        autogradeAndShow: autograde,
        shareAnswerKeyWithParents: shareKey,
      });
      await saveQuizQuestions(quizId, questions);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quizQueryKeys.detail(quizId) });
      await queryClient.invalidateQueries({ queryKey: quizQueryKeys.questions(quizId) });
      await queryClient.invalidateQueries({ queryKey: quizQueryKeys.list(courseId) });
      navigate(viewPath);
    },
  });

  const belongsHere = courseQuery.data?.organizationId === organization.id;

  return {
    organization,
    quiz,
    canEdit: canEdit && belongsHere,
    loading:
      quizQuery.isLoading ||
      questionsQuery.isLoading ||
      courseQuery.isLoading ||
      instructorsQuery.isLoading ||
      (Boolean(quiz) && !ready),
    loadError: quizQuery.error?.message ?? questionsQuery.error?.message ?? null,
    viewPath,
    title,
    setTitle,
    description,
    setDescription,
    windowFields,
    setWindowFields,
    allowMultiple,
    setAllowMultiple,
    autograde,
    setAutograde,
    shareKey,
    setShareKey,
    questions,
    setQuestions,
    saving: save.isPending,
    saveError: save.error?.message ?? null,
    hasChanges: ready,
    save: () => save.mutate(),
  };
}
