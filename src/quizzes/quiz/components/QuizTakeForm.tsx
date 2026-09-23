import { useMemo, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { quizChoiceLetter } from "@/materials/model/quiz";
import type {
  LinkedStudent,
  QuizAttemptAnswerRecord,
  QuizQuestionRecord,
} from "@/quizzes/databridge/quizzes";
import {
  clampAnswerLines,
  earnedQuizPoints,
  formatPoints,
  matchLayout,
  quizAnswerGrade,
  savedQuizAnswerFields,
  type QuizWindowState,
} from "@/quizzes/model/quiz";
import { formatDueDeadline } from "@/submissions/model/dueInstant";
import { QuizAnswerGradeBadge } from "./QuizAnswerGradeBadge";

const disabledFieldClass =
  "disabled:cursor-not-allowed disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]";

export function QuizTakeForm({
  questions,
  students,
  windowState,
  acceptsFrom,
  acceptsUntil,
  timeZone,
  allowMultiple,
  attemptsForStudent,
  latestAnswersForStudent,
  submitting,
  onSubmit,
}: {
  questions: QuizQuestionRecord[];
  students: LinkedStudent[];
  windowState: QuizWindowState;
  acceptsFrom: string | null;
  acceptsUntil: string | null;
  timeZone: string;
  allowMultiple: boolean;
  attemptsForStudent: (studentId: number) => number;
  latestAnswersForStudent: (studentId: number) => QuizAttemptAnswerRecord[];
  submitting: boolean;
  onSubmit: (args: {
    studentProfileId: number;
    answers: {
      questionId: number;
      choiceIds: number[];
      text: string;
      matches: { leftId: number; rightId: number }[];
    }[];
  }) => void;
}) {
  const [studentId, setStudentId] = useState<number | null>(students[0]?.id ?? null);
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [text, setText] = useState<Record<number, string>>({});
  const [matches, setMatches] = useState<Record<number, Record<number, number>>>({});
  const chosen = studentId ?? students[0]?.id ?? null;
  const already = chosen == null ? 0 : attemptsForStudent(chosen);
  const blocked = !allowMultiple && already > 0;
  const open = windowState === "open" && !blocked && chosen != null && questions.length > 0;
  const saved =
    !open && chosen != null
      ? savedQuizAnswerFields(latestAnswersForStudent(chosen))
      : null;
  const reviewAnswers = chosen != null && !open ? latestAnswersForStudent(chosen) : [];
  const shownSelected = saved?.selected ?? selected;
  const shownText = saved?.text ?? text;
  const shownMatches = saved?.matches ?? matches;

  const note = useMemo(() => {
    if (windowState === "not_yet" && acceptsFrom) {
      return `Opens ${formatDueDeadline(acceptsFrom, timeZone)}.`;
    }
    if (windowState === "closed") return "This quiz is no longer accepting entries.";
    if (blocked) return "This quiz already has an entry for that student.";
    if (questions.length === 0) return "This quiz doesn’t have questions yet.";
    return null;
  }, [acceptsFrom, blocked, questions.length, timeZone, windowState]);

  if (students.length === 0) {
    return (
      <p className="text-[14.5px] text-[var(--ink-soft)]">
        Link a student in this course to turn in this quiz.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!open || chosen == null) return;
        onSubmit({
          studentProfileId: chosen,
          answers: questions.map((question) => ({
            questionId: question.id,
            choiceIds: selected[question.id] ?? [],
            text: text[question.id] ?? "",
            matches: Object.entries(matches[question.id] ?? {}).flatMap(([leftId, rightId]) =>
              rightId ? [{ leftId: Number(leftId), rightId }] : [],
            ),
          })),
        });
      }}
    >
      {students.length > 1 ? (
        <label className="flex max-w-sm flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Student</span>
          <select
            className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[11px] text-[14.5px]"
            value={chosen ?? ""}
            onChange={(event) => setStudentId(Number(event.target.value))}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-[14px] text-[var(--ink-soft)]">For {students[0]?.name}</p>
      )}
      {note ? <p className="text-[14px] text-[var(--ink-soft)]">{note}</p> : null}
      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const savedAnswer = reviewAnswers.find((answer) => answer.questionId === question.id);
          const earned = savedAnswer ? earnedQuizPoints(savedAnswer) : null;
          const possible = savedAnswer?.pointsPossible ?? question.points;
          const grade =
            saved && savedAnswer ? quizAnswerGrade(earned, possible) : null;
          return (
            <li
              key={question.id}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-bold text-[var(--ink)]">
                  {index + 1}. {question.prompt.trim() || "Question"}
                </p>
                <span className="text-[12.5px] font-bold text-[var(--ink-faint)]">
                  {formatPoints(possible)} {possible === 1 ? "point" : "points"}
                </span>
                {grade ? (
                  <QuizAnswerGradeBadge grade={grade} earned={earned} possible={possible} />
                ) : null}
              </div>
              {question.kind === "long_answer" ? (
                <textarea
                  className={`mt-3 w-full rounded-[6px] border border-[var(--line)] px-3 py-2 text-[14.5px] ${disabledFieldClass}`}
                  rows={clampAnswerLines(question.answerLines ?? 4)}
                  value={shownText[question.id] ?? ""}
                  disabled={!open}
                  onChange={(event) =>
                    setText((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              ) : question.kind === "number" ? (
                <Input
                  className={`mt-3 w-full max-w-xs ${disabledFieldClass}`}
                  inputMode="decimal"
                  placeholder="Number"
                  value={shownText[question.id] ?? ""}
                  disabled={!open}
                  onChange={(event) =>
                    setText((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              ) : question.kind === "matching" ? (
                <MatchingFields
                  questionId={question.id}
                  prompts={question.prompts}
                  options={question.options}
                  picks={shownMatches[question.id] ?? {}}
                  disabled={!open}
                  onPick={(leftId, rightId) =>
                    setMatches((current) => ({
                      ...current,
                      [question.id]: { ...current[question.id], [leftId]: rightId },
                    }))
                  }
                />
              ) : question.kind === "short_answer" ? (
                <textarea
                  className={`mt-3 min-h-[5rem] w-full rounded-[6px] border border-[var(--line)] px-3 py-2 text-[14.5px] ${disabledFieldClass}`}
                  value={shownText[question.id] ?? ""}
                  disabled={!open}
                  onChange={(event) =>
                    setText((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {question.choices
                    .filter((choice) => choice.text.trim() !== "")
                    .map((choice, choiceIndex) => {
                      const checked = (shownSelected[question.id] ?? []).includes(choice.id);
                      return (
                        <li key={choice.id}>
                          <label
                            className={`flex items-start gap-2 text-[14.5px] ${
                              open ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-[var(--green)] disabled:cursor-not-allowed"
                              checked={checked}
                              disabled={!open}
                              onChange={() => {
                                setSelected((current) => {
                                  const list = current[question.id] ?? [];
                                  const next = checked
                                    ? list.filter((id) => id !== choice.id)
                                    : [...list, choice.id];
                                  return { ...current, [question.id]: next };
                                });
                              }}
                            />
                            <span>
                              {quizChoiceLetter(choiceIndex)}. {choice.text}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      {open ? (
        <div>
          <Button type="submit" disabled={submitting}>
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden />
            {submitting ? "Submitting…" : "Submit"}
          </Button>
          {acceptsUntil ? (
            <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
              Accepting entries until {formatDueDeadline(acceptsUntil, timeZone)}.
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function MatchingFields({
  questionId,
  prompts,
  options,
  picks,
  disabled,
  onPick,
}: {
  questionId: number;
  prompts: QuizQuestionRecord["prompts"];
  options: QuizQuestionRecord["options"];
  picks: Record<number, number>;
  disabled: boolean;
  onPick: (leftId: number, rightId: number) => void;
}) {
  const layout = matchLayout(prompts, options, questionId);
  if (layout.left.length === 0 || layout.right.length === 0) {
    return <p className="mt-3 text-[14px] text-[var(--ink-soft)]">This match isn’t ready yet.</p>;
  }
  return (
    <div className="mt-3 flex flex-col gap-3">
      {layout.left.map((item, index) => (
        <label key={item.id} className="flex flex-col gap-1">
          <span className={`text-[14.5px] ${disabled ? "text-[var(--ink-soft)]" : "text-[var(--ink)]"}`}>
            {index + 1}. {item.text}
          </span>
          <select
            className={`max-w-md rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-3 py-[11px] text-[14.5px] ${disabledFieldClass}`}
            value={picks[item.id] ?? ""}
            disabled={disabled}
            onChange={(event) => onPick(item.id, Number(event.target.value))}
          >
            <option value="">Choose</option>
            {layout.right.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.text}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
