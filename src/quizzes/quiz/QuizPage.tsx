import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { getGradingScale, gradingScaleQueryKeys } from "@/grading/databridge/scales";
import { percentOf, percentToLabel } from "@/grading/model/scale";
import {
  CheckIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  PrinterIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
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
import type { QuizAttemptAnswerRecord, QuizAttemptRecord } from "@/quizzes/databridge/quizzes";
import { quizEditPath, quizPrintPath } from "@/quizzes/model/paths";
import {
  formatQuizScore,
  orderedAttemptAnswers,
  quizGradingQueue,
} from "@/quizzes/model/quiz";
import { viewerTimeZone } from "@/quizzes/model/window";
import { AnswerKeySection } from "./components/AnswerKeySection";
import { QuizAttemptList } from "./components/QuizAttemptList";
import { QuizGradeWalkthrough } from "./components/QuizGradeWalkthrough";
import { QuizSubmissionQueue } from "./components/QuizSubmissionQueue";
import { QuizTakeForm } from "./components/QuizTakeForm";
import { useQuiz } from "./hooks/useQuiz";

export function QuizPage() {
  const page = useQuiz();
  const { organization } = useOrgShell();
  const scaleQuery = useQuery({
    queryKey: gradingScaleQueryKeys.org(organization.id),
    queryFn: () => getGradingScale(organization.id),
  });
  function formatScore(score: number, scoreTotal: number) {
    const base = formatQuizScore(score, scoreTotal);
    const label = scaleQuery.data
      ? percentToLabel(percentOf(score, scoreTotal), scaleQuery.data)
      : null;
    return label ? `${base} · ${label}` : base;
  }
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
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
                <PencilSquareIcon className="h-4 w-4" aria-hidden />
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
              <CheckIcon className="h-4 w-4" aria-hidden />
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
                  if (
                    submitted.autograded &&
                    submitted.score != null &&
                    submitted.scoreTotal != null
                  ) {
                    setResult(formatScore(submitted.score, submitted.scoreTotal));
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
        {page.canEdit ? (
          <TeacherGrading
            attempts={page.attempts}
            questionIds={page.questions.map((question) => question.id)}
            timeZone={zone}
            gradingId={Number(searchParams.get("grade"))}
            saving={page.gradeAttempt.isPending}
            onOpen={(attemptId) => setSearchParams({ grade: String(attemptId) })}
            onBack={() => setSearchParams({})}
            onSave={(attemptId, points, thenNext, nextId) =>
              page.gradeAttempt.mutate(
                { attemptId, points },
                {
                  onSuccess: () => {
                    if (!thenNext) return;
                    if (nextId) setSearchParams({ grade: String(nextId) });
                    else setSearchParams({});
                  },
                },
              )
            }
          />
        ) : (
          <QuizAttemptList attempts={familyAttempts} timeZone={zone} formatScore={formatScore} />
        )}
        {page.showKey ? <AnswerKeySection questions={page.questions} /> : null}
        {page.canEdit && isPublished(quiz.visibility) ? (
          <div className="mt-10">
            <Button
              variant="secondary"
              disabled={page.publish.isPending}
              onClick={() => page.publish.mutate("unpublished")}
            >
              <EyeSlashIcon className="h-4 w-4" aria-hidden />
              Unpublish
            </Button>
          </div>
        ) : null}
        {page.canEdit ? (
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setConfirmRemove(true)}>
              <TrashIcon className="h-4 w-4" aria-hidden />
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

function TeacherGrading({
  attempts,
  questionIds,
  timeZone,
  gradingId,
  saving,
  onOpen,
  onBack,
  onSave,
}: {
  attempts: Array<QuizAttemptRecord & { label: string; answers: QuizAttemptAnswerRecord[] }>;
  questionIds: number[];
  timeZone: string;
  gradingId: number;
  saving: boolean;
  onOpen: (attemptId: number) => void;
  onBack: () => void;
  onSave: (
    attemptId: number,
    points: { questionId: number; points: number }[],
    thenNext: boolean,
    nextId: number | null,
  ) => void;
}) {
  const queue = quizGradingQueue(attempts);
  const selected = attempts.find((attempt) => attempt.id === gradingId);
  if (!selected || !Number.isFinite(gradingId)) {
    return (
      <QuizSubmissionQueue
        attempts={attempts}
        timeZone={timeZone}
        onOpen={onOpen}
        onGradeNext={() => {
          const next = queue[0];
          if (next) onOpen(next.id);
        }}
      />
    );
  }
  const index = queue.findIndex((attempt) => attempt.id === selected.id);
  const nextId = index >= 0 ? (queue[index + 1]?.id ?? null) : (queue[0]?.id ?? null);
  const ordered = {
    ...selected,
    answers: orderedAttemptAnswers(questionIds, selected.answers),
  };
  if (ordered.answers.length === 0) {
    return <p className="mt-8 text-[14px] text-[var(--ink-soft)]">Loading this submission…</p>;
  }
  return (
    <QuizGradeWalkthrough
      key={ordered.id}
      attempt={ordered}
      timeZone={timeZone}
      saving={saving}
      hasNext={nextId != null}
      onBack={onBack}
      onSave={(points, thenNext) => onSave(ordered.id, points, thenNext, nextId)}
    />
  );
}
