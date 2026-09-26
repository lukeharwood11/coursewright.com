import { QuizKeyModeTabs } from "./QuizKeyModeTabs";
import type { UnitPrintQuizOption } from "../hooks/useUnitPrintOptions";
import type { QuizKeyPrintMode } from "@/print/model/quizKeyPrintMode";

export function SingleQuizPrintOptionsPanel({
  mode,
  onModeChange,
}: {
  mode: QuizKeyPrintMode;
  onModeChange: (mode: QuizKeyPrintMode) => void;
}) {
  return (
    <aside className="hidden w-full max-w-[22rem] shrink-0 border-r border-[var(--line)] bg-[var(--paper)] md:block md:w-[22rem]">
      <div className="sticky top-[4.25rem] max-h-[calc(100dvh-4.25rem)] overflow-y-auto p-4">
        <h2 className="text-[15px] font-bold text-[var(--ink)]">Print options</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-soft)]">
          Choose a worksheet, the answers, or both in one PDF.
        </p>
        <div className="mt-4">
          <QuizKeyModeTabs value={mode} onChange={onModeChange} />
        </div>
      </div>
    </aside>
  );
}

export function UnitQuizPrintOptionsPanel({
  quizzes,
  onModeChange,
}: {
  quizzes: UnitPrintQuizOption[];
  onModeChange: (quizId: number, mode: QuizKeyPrintMode) => void;
}) {
  const keyQuizzes = quizzes.filter((row) => row.canShowKey);
  if (keyQuizzes.length === 0) return null;

  return (
    <aside className="hidden w-full max-w-[22rem] shrink-0 border-r border-[var(--line)] bg-[var(--paper)] md:block md:w-[22rem]">
      <div className="sticky top-[4.25rem] max-h-[calc(100dvh-4.25rem)] overflow-y-auto p-4">
        <h2 className="text-[15px] font-bold text-[var(--ink)]">Quiz print</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-soft)]">
          Materials always print as worksheets. Choose how each quiz appears.
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {keyQuizzes.map((quiz) => (
            <li
              key={quiz.quizId}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3"
            >
              <p className="text-[14px] font-medium text-[var(--ink)]">{quiz.title}</p>
              <div className="mt-2">
                <QuizKeyModeTabs
                  value={quiz.mode}
                  onChange={(mode) => onModeChange(quiz.quizId, mode)}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function QuizPrintOptionsModalBody({
  variant,
  mode,
  onModeChange,
  unitQuizzes,
  onUnitQuizModeChange,
}: {
  variant: "quiz" | "unit";
  mode?: QuizKeyPrintMode;
  onModeChange?: (mode: QuizKeyPrintMode) => void;
  unitQuizzes?: UnitPrintQuizOption[];
  onUnitQuizModeChange?: (quizId: number, mode: QuizKeyPrintMode) => void;
}) {
  if (variant === "quiz" && mode && onModeChange) {
    return (
      <div className="p-4">
        <QuizKeyModeTabs value={mode} onChange={onModeChange} />
      </div>
    );
  }
  if (variant === "unit" && unitQuizzes && onUnitQuizModeChange) {
    const keyQuizzes = unitQuizzes.filter((row) => row.canShowKey);
    return (
      <ul className="flex flex-col gap-3 p-4">
        {keyQuizzes.map((quiz) => (
          <li
            key={quiz.quizId}
            className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3"
          >
            <p className="text-[14px] font-medium text-[var(--ink)]">{quiz.title}</p>
            <div className="mt-2">
              <QuizKeyModeTabs
                value={quiz.mode}
                onChange={(next) => onUnitQuizModeChange(quiz.quizId, next)}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}
