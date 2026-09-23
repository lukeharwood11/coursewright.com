import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import {
  quizAnswerGradeLabel,
  type QuizAnswerGrade,
} from "@/quizzes/model/quiz";

function gradeBadgeVariant(grade: QuizAnswerGrade): "green" | "amber" | "slate" {
  if (grade === "correct") return "green";
  if (grade === "incorrect") return "amber";
  return "slate";
}

export function QuizAnswerGradeBadge({ grade }: { grade: QuizAnswerGrade }) {
  return (
    <Badge variant={gradeBadgeVariant(grade)}>
      {grade === "correct" ? <CheckIcon className="h-3.5 w-3.5" aria-hidden /> : null}
      {grade === "incorrect" ? <XMarkIcon className="h-3.5 w-3.5" aria-hidden /> : null}
      {quizAnswerGradeLabel(grade)}
    </Badge>
  );
}
