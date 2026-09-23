import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import {
  quizAnswerGradeLabel,
  type QuizAnswerGrade,
} from "@/quizzes/model/quiz";

function gradeBadgeVariant(grade: QuizAnswerGrade): "green" | "amber" | "slate" {
  if (grade === "correct") return "green";
  if (grade === "incorrect") return "amber";
  if (grade === "partial") return "slate";
  return "slate";
}

export function QuizAnswerGradeBadge({
  grade,
  earned = null,
  possible = null,
}: {
  grade: QuizAnswerGrade;
  earned?: number | null;
  possible?: number | null;
}) {
  return (
    <Badge variant={gradeBadgeVariant(grade)}>
      {grade === "correct" ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : null}
      {grade === "incorrect" ? <XMarkIcon className="h-3.5 w-3.5" aria-hidden /> : null}
      {quizAnswerGradeLabel(grade, earned, possible)}
    </Badge>
  );
}
