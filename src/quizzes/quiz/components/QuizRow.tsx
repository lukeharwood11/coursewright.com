import {
  CheckIcon,
  ClipboardDocumentCheckIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { formatIsoDate } from "@/courses/model/dates";
import { isPublished, type MaterialVisibility } from "@/materials/model/visibility";
import {
  quizOutlineProgress,
  type QuizOutlineProgress,
} from "@/quizzes/model/quiz";
import { quizLocationState } from "@/quizzes/model/navigation";
import { quizAssignedDate, quizDueDate } from "@/quizzes/model/window";
import { quizPath, quizPrintPath } from "@/quizzes/model/paths";

export function QuizRow({
  orgSlug,
  courseId,
  unitId,
  quizId,
  title,
  description,
  visibility,
  acceptsFrom,
  acceptsUntil,
  acceptsTimezone,
  attempt,
  fromUnitPage = false,
}: {
  orgSlug: string;
  courseId: number;
  unitId: number;
  quizId: number;
  title: string;
  description: string;
  visibility: MaterialVisibility;
  acceptsFrom?: string | null;
  acceptsUntil?: string | null;
  acceptsTimezone?: string | null;
  attempt?: {
    score: number | null;
    scoreTotal: number | null;
    ungradedAnswerCount: number;
  } | null;
  fromUnitPage?: boolean;
}) {
  const href = quizPath({ orgSlug, courseId, unitId, quizId });
  const printHref = quizPrintPath({ orgSlug, courseId, unitId, quizId });
  const assigned = quizAssignedDate(acceptsFrom ?? null, acceptsTimezone ?? null);
  const due = quizDueDate(acceptsUntil ?? null, acceptsTimezone ?? null);
  const progress = quizOutlineProgress(attempt);

  return (
    <li className="flex items-center gap-2 border-t border-[var(--line-soft)] px-4 py-2.5">
      <ClipboardDocumentCheckIcon className="h-5 w-5 shrink-0 text-[var(--ink-faint)]" aria-hidden />
      <Link
        to={href}
        state={quizLocationState(fromUnitPage)}
        className="min-w-0 flex-1"
      >
        <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">{title}</span>
        {description ? (
          <span className="block truncate text-[12.5px] text-[var(--ink-soft)]">{description}</span>
        ) : null}
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="slate">Quiz</Badge>
          {!isPublished(visibility) ? <Badge variant="amber">Unpublished</Badge> : null}
          <QuizProgressCue progress={progress} />
          {assigned ? (
            <span className="text-[12px] font-bold text-[var(--slate)]">
              Assigned {formatIsoDate(assigned)}
            </span>
          ) : null}
          {due ? (
            <span className="text-[12px] font-bold text-[var(--amber-deep)]">
              Due {formatIsoDate(due)}
            </span>
          ) : null}
        </span>
      </Link>
      <ButtonLink
        variant="secondary"
        to={printHref}
        className="shrink-0 px-2.5 py-1.5 text-[12px]"
      >
        <PrinterIcon className="h-4 w-4" aria-hidden />
        Print
      </ButtonLink>
    </li>
  );
}

function QuizProgressCue({ progress }: { progress: QuizOutlineProgress }) {
  if (progress.kind === "scored") {
    return <Badge variant="green">{progress.label}</Badge>;
  }
  if (progress.kind === "submitted") {
    return (
      <Badge variant="green">
        <CheckIcon className="h-3.5 w-3.5" aria-hidden />
        Submitted
      </Badge>
    );
  }
  return null;
}
