import { useEffect, useRef, useState } from "react";
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
import { questionPointsAreValid, roundPoints } from "@/quizzes/model/quiz";
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
    points: question.points,
  }));
}

export function useQuizEdit() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : NaN;
  const quizId = params.quizId ? Number(params.quizId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
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
  const [savedTitle, setSavedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptEntries, setAcceptEntries] = useState(false);
  const [windowFields, setWindowFields] = useState<WindowFields>(emptyWindowFields());
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [autograde, setAutograde] = useState(false);
  const [shareKey, setShareKey] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([]);
  const [ready, setReady] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleCommitRef = useRef<Promise<boolean> | null>(null);
  const titleRef = useRef(title);
  const savedTitleRef = useRef(savedTitle);
  titleRef.current = title;
  savedTitleRef.current = savedTitle;

  useEffect(() => {
    if (!quiz || ready) return;
    const zone = viewerTimeZone(quiz.acceptsTimezone);
    setTitle(quiz.title);
    setSavedTitle(quiz.title);
    setDescription(quiz.description);
    setAcceptEntries(quiz.acceptEntries);
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

  async function invalidateQuizCaches() {
    await queryClient.invalidateQueries({ queryKey: quizQueryKeys.detail(quizId) });
    await queryClient.invalidateQueries({ queryKey: quizQueryKeys.questions(quizId) });
    await queryClient.invalidateQueries({ queryKey: quizQueryKeys.list(courseId) });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error("We couldn’t find that quiz.");
      const trimmed = titleRef.current.trim() || savedTitleRef.current;
      if (!trimmed) throw new Error("Give the quiz a title.");
      const zone = viewerTimeZone(quiz.acceptsTimezone);
      const instants = instantsFromWindowFields(windowFields, zone);
      if (
        acceptEntries &&
        instants.acceptsFrom &&
        instants.acceptsUntil &&
        new Date(instants.acceptsUntil) <= new Date(instants.acceptsFrom)
      ) {
        throw new Error("The end time needs to be after the start time.");
      }
      if (questions.some((question) => !questionPointsAreValid(question.points))) {
        throw new Error("Each question needs possible points greater than 0, such as 1 or 4.5.");
      }
      await updateQuiz(quizId, {
        title: trimmed,
        description: description.trim(),
        acceptEntries,
        acceptsFrom: instants.acceptsFrom,
        acceptsUntil: instants.acceptsUntil,
        acceptsTimezone: instants.acceptsFrom || instants.acceptsUntil ? zone : null,
        allowMultipleAttempts: allowMultiple,
        autogradeAndShow: autograde,
        shareAnswerKeyWithParents: shareKey,
      });
      await saveQuizQuestions(
        quizId,
        questions.map((question) => ({ ...question, points: roundPoints(question.points) })),
      );
      setTitle(trimmed);
      setSavedTitle(trimmed);
    },
    onSuccess: async () => {
      await invalidateQuizCaches();
    },
  });

  /**
   * Saves the name on blur, Enter, or leave. Coalesces overlapping calls.
   * Empty names revert to the last saved title.
   */
  async function commitTitle(): Promise<boolean> {
    if (titleCommitRef.current) return titleCommitRef.current;
    const run = (async () => {
      if (!quiz || save.isPending) return true;
      const next = titleRef.current.trim();
      const previous = savedTitleRef.current;
      if (!next) {
        setTitleError("Give the quiz a title.");
        setTitle(previous);
        return false;
      }
      if (next === previous) {
        setTitle(previous);
        setTitleError(null);
        return true;
      }
      setSavingTitle(true);
      setTitleError(null);
      try {
        await updateQuiz(quizId, { title: next });
        setTitle(next);
        setSavedTitle(next);
        await invalidateQuizCaches();
        return true;
      } catch (caught: unknown) {
        setTitleError(
          caught instanceof Error ? caught.message : "Couldn’t save the title.",
        );
        return false;
      } finally {
        setSavingTitle(false);
      }
    })();
    titleCommitRef.current = run.finally(() => {
      titleCommitRef.current = null;
    });
    return titleCommitRef.current;
  }

  /** Returns true when save succeeded. */
  async function saveQuiz(): Promise<boolean> {
    const titleOk = await commitTitle();
    if (!titleOk) return false;
    try {
      await save.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }

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
    commitTitle,
    description,
    setDescription,
    acceptEntries,
    setAcceptEntries,
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
    saving: save.isPending || savingTitle,
    saveError: save.error?.message ?? titleError,
    hasChanges: ready,
    save: saveQuiz,
  };
}
