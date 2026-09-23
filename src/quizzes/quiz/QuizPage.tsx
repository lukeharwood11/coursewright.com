import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { useToastOnError } from "@/ui/useToastOnError";
import { coursePath } from "@/courses/model/paths";
import { isPublished } from "@/materials/model/visibility";
import {
  quizBackDestination,
  quizLocationState,
  quizOpenedFromUnit,
} from "@/quizzes/model/navigation";
import { quizEditPath, quizPrintPath } from "@/quizzes/model/paths";
import { formatQuizScore } from "@/quizzes/model/quiz";
import { viewerTimeZone } from "@/quizzes/model/window";
import { AnswerKeySection } from "./components/AnswerKeySection";
import { QuizAttemptList } from "./components/QuizAttemptList";
import { QuizTakeForm } from "./components/QuizTakeForm";
import { useQuiz } from "./hooks/useQuiz";

export function QuizPage() {
  const page = useQuiz();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  useToastOnError(page.error);

  useEffect(() => {
    document.title = page.quiz
      ? `${page.quiz.title} · Course Wright`
      : "Quiz · Course Wright";
  }, [page.quiz]);

  if (page.loading) return <PageLoading label="Loading quiz…" />;

  if (page.notFound || !page.quiz) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that quiz
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={coursePath(page.organization.slug, page.courseId)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to course
          </Link>
        </p>
      </div>
    );
  }

  const quiz = page.quiz;
  const zone = viewerTimeZone(quiz.acceptsTimezone);
  const fromUnit = quizOpenedFromUnit(location.state);
  const quizNavState = quizLocationState(fromUnit);
  const back = quizBackDestination({
    fromUnit,
    orgSlug: page.organization.slug,
    courseId: page.courseId,
    courseTitle: page.course?.title ?? "course",
    unit: page.unit,
  });
  const pathArgs = {
    orgSlug: page.organization.slug,
    courseId: page.courseId,
    unitId: page.unitId,
    quizId: quiz.id,
  };
  const familyAttempts = page.attempts.filter((attempt) =>
    page.linkedStudents.some((student) => student.id === attempt.studentProfileId),
  );

  return (
    <div>
      <DetailPageHeader
        backTo={back.to}
        backLabel={back.label}
        title={quiz.title}
        meta={
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge variant="slate">Quiz</Badge>
            {isPublished(quiz.visibility) && page.canEdit ? <PublishedBadge /> : null}
            {!isPublished(quiz.visibility) && page.canEdit ? (
              <Badge variant="amber">Unpublished</Badge>
            ) : null}
          </span>
        }
        description={quiz.description || undefined}
        actions={
          <span className="flex flex-wrap gap-2">
            <ButtonLink variant="secondary" to={quizPrintPath(pathArgs)}>
              <PrinterIcon className="h-4 w-4" aria-hidden />
              Print
            </ButtonLink>
            {page.canEdit ? (
              <ButtonLink
                variant="secondary"
                to={quizEditPath(pathArgs)}
                state={quizNavState}
              >
                Edit
              </ButtonLink>
            ) : null}
          </span>
        }
      />
      <div className="px-5 py-6 md:px-8">
        {!isPublished(quiz.visibility) && page.canEdit ? (
          <div className="mb-4 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] px-4 py-3">
            <p className="text-[14px] text-[var(--ink)]">
              Families can’t see this quiz until you publish it.
            </p>
            <Button
              className="mt-3"
              disabled={page.publish.isPending}
              onClick={() => page.publish.mutate("published")}
            >
              {page.publish.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        ) : null}
        {page.isParent && page.windowState !== "download_only" ? (
          <QuizTakeForm
            questions={page.questions}
            students={page.linkedStudents}
            windowState={page.windowState}
            acceptsFrom={quiz.acceptsFrom}
            acceptsUntil={quiz.acceptsUntil}
            timeZone={zone}
            allowMultiple={quiz.allowMultipleAttempts}
            attemptsForStudent={(studentId) =>
              page.attempts.filter((attempt) => attempt.studentProfileId === studentId).length
            }
            latestAnswersForStudent={(studentId) =>
              page.attempts.find((attempt) => attempt.studentProfileId === studentId)?.answers ??
              []
            }
            submitting={page.submit.isPending}
            onSubmit={(args) => {
              setResult(null);
              page.submit.mutate(args, {
                onSuccess: (submitted) => {
                  const needsManualGrade = page.questions.some(
                    (question) =>
                      question.kind === "short_answer" || question.kind === "long_answer",
                  );
                  if (
                    submitted.autograded &&
                    submitted.score != null &&
                    submitted.scoreTotal != null &&
                    !needsManualGrade
                  ) {
                    setResult(formatQuizScore(submitted.score, submitted.scoreTotal));
                  } else {
                    setResult("Submitted.");
                  }
                },
              });
            }}
          />
        ) : null}
        {page.isParent && page.windowState === "download_only" ? (
          <p className="text-[15px] text-[var(--ink)]">
            Print or download this quiz. It isn’t taken in Course Wright.
          </p>
        ) : null}
        {result ? (
          <p className="mt-4 text-[15px] font-bold text-[var(--ink)]">{result}</p>
        ) : null}
        <QuizAttemptList
          attempts={page.canEdit ? page.attempts : familyAttempts}
          timeZone={zone}
          showAll={page.canEdit}
          canGrade={page.canEdit}
          gradingKey={
            page.gradeAnswer.isPending && page.gradeAnswer.variables
              ? `${page.gradeAnswer.variables.attemptId}:${page.gradeAnswer.variables.questionId}`
              : null
          }
          onGrade={(args) => page.gradeAnswer.mutate(args)}
        />
        {page.showKey ? <AnswerKeySection questions={page.questions} /> : null}
        {page.canEdit && isPublished(quiz.visibility) ? (
          <div className="mt-10">
            <Button
              variant="secondary"
              disabled={page.publish.isPending}
              onClick={() => page.publish.mutate("unpublished")}
            >
              Unpublish
            </Button>
          </div>
        ) : null}
        {page.canEdit ? (
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setConfirmRemove(true)}>
              Remove quiz
            </Button>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove this quiz?"
        body="Families will no longer see it."
        confirmLabel={page.remove.isPending ? "Removing…" : "Remove quiz"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          page.remove.mutate(undefined, {
            onSuccess: () => navigate(back.to),
          });
        }}
      />
    </div>
  );
}
