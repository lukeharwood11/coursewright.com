import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { staffCanManageCourse } from "@/courses/model/access";
import { courseQueryKeys, getCourse, listCourseInstructors } from "@/courses/databridge/courses";
import {
  getQuiz,
  gradeQuizAttempt,
  listAttemptAnswers,
  listLinkedStudents,
  listQuizAttempts,
  listQuizQuestions,
  quizQueryKeys,
  submitQuizAttempt,
  updateQuiz,
} from "@/quizzes/databridge/quizzes";
import {
  accountIsStudentOnCourse,
  canShowAnswerKey,
  quizAttemptLabel,
  quizWindowState,
} from "@/quizzes/model/quiz";
import { getUnit } from "@/units/databridge/units";

export function useQuiz() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : NaN;
  const quizId = params.quizId ? Number(params.quizId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const staffEdit = staffCanEdit(role, parentPresentation);

  const quizQuery = useQuery({
    queryKey: quizQueryKeys.detail(quizId),
    queryFn: () => getQuiz(quizId),
    enabled: Number.isFinite(quizId),
  });
  const courseQuery = useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const unitQuery = useQuery({
    queryKey: ["units", "detail", unitId],
    queryFn: () => getUnit(unitId),
    enabled: Number.isFinite(unitId),
  });
  const questionsQuery = useQuery({
    queryKey: quizQueryKeys.questions(quizId),
    queryFn: () => listQuizQuestions(quizId),
    enabled: Number.isFinite(quizId),
  });
  const attemptsQuery = useQuery({
    queryKey: quizQueryKeys.attempts(quizId),
    queryFn: () => listQuizAttempts(quizId),
    enabled: Number.isFinite(quizId),
  });
  const answersQuery = useQuery({
    queryKey: ["quizzes", "answers", quizId, (attemptsQuery.data ?? []).map((row) => row.id).join(",")],
    queryFn: () => listAttemptAnswers((attemptsQuery.data ?? []).map((row) => row.id)),
    enabled: (attemptsQuery.data ?? []).length > 0,
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId) && staffEdit,
  });
  const studentsQuery = useQuery({
    queryKey: ["quizzes", "students", courseId, user.id],
    queryFn: () => listLinkedStudents(courseId, user.id),
    enabled: Number.isFinite(courseId) && parentPresentation,
  });

  const quiz = quizQuery.data ?? null;
  const course = courseQuery.data ?? null;
  const belongsHere =
    quiz != null &&
    quiz.courseId === courseId &&
    (Number.isFinite(unitId) ? quiz.unitId === unitId : true) &&
    course?.organizationId === organization.id;
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: (instructorsQuery.data ?? []).map((row) => row.userId),
  });
  const familyHidden =
    parentPresentation &&
    (quiz?.visibility !== "published" ||
      course == null ||
      course.visibility !== "published" ||
      course.status !== "active");
  const viewerIsStudent = accountIsStudentOnCourse(user.email, studentsQuery.data ?? []);
  const accountEmail = user.email?.trim().toLowerCase() ?? "";
  const linkedStudents = (studentsQuery.data ?? []).filter((student) => {
    if (!viewerIsStudent) return true;
    return student.studentEmail?.trim().toLowerCase() === accountEmail;
  });
  const teacherView = canEdit;
  const showKey = canShowAnswerKey({
    teacherView,
    shareWithParents: Boolean(quiz?.shareAnswerKeyWithParents),
    viewerIsStudent,
  });
  const windowState = quiz
    ? quizWindowState(
        { acceptsFrom: quiz.acceptsFrom, acceptsUntil: quiz.acceptsUntil },
        new Date(),
      )
    : "download_only";

  const attempts = (attemptsQuery.data ?? []).map((attempt) => ({
    ...attempt,
    label: quizAttemptLabel({
      parentName: attempt.submitterName,
      studentName: attempt.studentName,
      submitterIsStudent:
        attempt.submitterEmail.trim().toLowerCase() ===
        (attempt.studentEmail ?? "").trim().toLowerCase(),
    }),
    answers: (answersQuery.data ?? []).filter((answer) => answer.attemptId === attempt.id),
  }));

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: quizQueryKeys.detail(quizId) });
    void queryClient.invalidateQueries({ queryKey: quizQueryKeys.questions(quizId) });
    void queryClient.invalidateQueries({ queryKey: quizQueryKeys.attempts(quizId) });
    void queryClient.invalidateQueries({ queryKey: quizQueryKeys.list(courseId) });
    void queryClient.invalidateQueries({ queryKey: ["quizzes", "answers", quizId] });
    void queryClient.invalidateQueries({
      queryKey: ["quizzes", "attempt-summaries", courseId],
    });
  }

  const publish = useMutation({
    mutationFn: (visibility: "published" | "unpublished") =>
      updateQuiz(quizId, { visibility }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () =>
      updateQuiz(quizId, { deletedAt: new Date().toISOString(), deletedBy: user.id }),
    onSuccess: invalidate,
  });
  const submit = useMutation({
    mutationFn: (args: {
      studentProfileId: number;
      answers: {
        questionId: number;
        choiceIds: number[];
        text: string;
        matches: { leftId: number; rightId: number }[];
      }[];
    }) => submitQuizAttempt({ quizId, ...args }),
    onSuccess: invalidate,
  });
  const gradeAttempt = useMutation({
    mutationFn: (args: {
      attemptId: number;
      points: { questionId: number; points: number }[];
    }) => gradeQuizAttempt(args),
    onSuccess: invalidate,
  });

  return {
    organization,
    courseId,
    unitId: Number.isFinite(unitId) ? unitId : quiz?.unitId ?? null,
    quiz: belongsHere ? quiz : null,
    course,
    unit: unitQuery.data ?? null,
    questions: questionsQuery.data ?? [],
    attempts,
    linkedStudents,
    showKey,
    windowState,
    canEdit,
    isParent: parentPresentation,
    loading: quizQuery.isLoading || courseQuery.isLoading || questionsQuery.isLoading,
    error:
      quizQuery.error?.message ??
      courseQuery.error?.message ??
      questionsQuery.error?.message ??
      attemptsQuery.error?.message ??
      publish.error?.message ??
      submit.error?.message ??
      gradeAttempt.error?.message ??
      null,
    notFound: !quizQuery.isLoading && (!quiz || !belongsHere || familyHidden),
    publish,
    remove,
    submit,
    gradeAttempt,
  };
}
