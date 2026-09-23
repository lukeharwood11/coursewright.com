import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import type { QuizQuestionDraft } from "@/quizzes/databridge/quizzes";
import type { WindowFields } from "@/quizzes/model/window";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

function blankQuestion(): QuizQuestionDraft {
  return {
    id: null,
    prompt: "",
    kind: "multiple_choice",
    answer: "",
    choices: [
      { id: null, text: "", correct: false },
      { id: null, text: "", correct: false },
      { id: null, text: "", correct: false },
      { id: null, text: "", correct: false },
    ],
  };
}

export function QuizEditorForm({
  title,
  description,
  windowFields,
  allowMultiple,
  autograde,
  shareKey,
  questions,
  onTitle,
  onDescription,
  onWindow,
  onAllowMultiple,
  onAutograde,
  onShareKey,
  onQuestions,
}: {
  title: string;
  description: string;
  windowFields: WindowFields;
  allowMultiple: boolean;
  autograde: boolean;
  shareKey: boolean;
  questions: QuizQuestionDraft[];
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onWindow: (value: WindowFields) => void;
  onAllowMultiple: (value: boolean) => void;
  onAutograde: (value: boolean) => void;
  onShareKey: (value: boolean) => void;
  onQuestions: (value: QuizQuestionDraft[]) => void;
}) {
  function patchQuestion(index: number, patch: Partial<QuizQuestionDraft>) {
    onQuestions(questions.map((question, i) => (i === index ? { ...question, ...patch } : question)));
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input className="w-full" required value={title} onChange={(event) => onTitle(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Description</span>
        <textarea
          className={`${controlClass} min-h-[4.5rem] resize-y`}
          value={description}
          onChange={(event) => onDescription(event.target.value)}
        />
      </label>
      <fieldset className="rounded-[10px] border border-[var(--line-soft)] p-4">
        <legend className="px-1 text-[13px] font-bold text-[var(--ink-soft)]">
          Accept entries
        </legend>
        <p className="text-[12.5px] text-[var(--ink-faint)]">
          Leave both blank to print and download only. Families can submit only while the window is open.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <WindowBound
            label="Starting"
            date={windowFields.fromDate}
            time={windowFields.fromTime}
            onDate={(fromDate) => onWindow({ ...windowFields, fromDate })}
            onTime={(fromTime) => onWindow({ ...windowFields, fromTime })}
          />
          <WindowBound
            label="Until"
            date={windowFields.untilDate}
            time={windowFields.untilTime}
            onDate={(untilDate) => onWindow({ ...windowFields, untilDate })}
            onTime={(untilTime) => onWindow({ ...windowFields, untilTime })}
          />
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-[14.5px]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--green)]"
          checked={allowMultiple}
          onChange={(event) => onAllowMultiple(event.target.checked)}
        />
        <span>
          <span className="font-bold">Allow more than one attempt</span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
            Off means one entry per student.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-[14.5px]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--green)]"
          checked={autograde}
          onChange={(event) => onAutograde(event.target.checked)}
        />
        <span>
          <span className="font-bold">
            Grade multiple-choice questions automatically and show the score right away
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-[14.5px]">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--green)]"
          checked={shareKey}
          onChange={(event) => onShareKey(event.target.checked)}
        />
        <span>
          <span className="font-bold">Share answer key with parents</span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
            Students never see the answer key.
          </span>
        </span>
      </label>
      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Questions</h2>
        {questions.map((question, index) => (
          <div key={`${question.id ?? "new"}-${index}`} className="rounded-[10px] border border-[var(--line-soft)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-[var(--ink-soft)]">Question {index + 1}</p>
              <Button
                variant="secondary"
                onClick={() => onQuestions(questions.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Prompt</span>
              <textarea
                className={`${controlClass} min-h-[4rem] resize-y`}
                value={question.prompt}
                onChange={(event) => patchQuestion(index, { prompt: event.target.value })}
              />
            </label>
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Kind</span>
              <select
                className={controlClass}
                value={question.kind}
                onChange={(event) =>
                  patchQuestion(index, {
                    kind: event.target.value === "short_answer" ? "short_answer" : "multiple_choice",
                  })
                }
              >
                <option value="multiple_choice">Multiple choice</option>
                <option value="short_answer">Short answer</option>
              </select>
            </label>
            {question.kind === "short_answer" ? (
              <label className="mt-3 flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">Answer</span>
                <Input
                  className="w-full"
                  value={question.answer}
                  onChange={(event) => patchQuestion(index, { answer: event.target.value })}
                />
              </label>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {question.choices.map((choice, choiceIndex) => (
                  <li key={`${choice.id ?? "c"}-${choiceIndex}`} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[var(--green)]"
                      checked={choice.correct}
                      aria-label={`Correct choice ${choiceIndex + 1}`}
                      onChange={(event) => {
                        const choices = question.choices.map((item, i) =>
                          i === choiceIndex ? { ...item, correct: event.target.checked } : item,
                        );
                        patchQuestion(index, { choices });
                      }}
                    />
                    <Input
                      className="w-full"
                      value={choice.text}
                      placeholder={`Choice ${choiceIndex + 1}`}
                      onChange={(event) => {
                        const choices = question.choices.map((item, i) =>
                          i === choiceIndex ? { ...item, text: event.target.value } : item,
                        );
                        patchQuestion(index, { choices });
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <Button variant="ghost" fullWidth onClick={() => onQuestions([...questions, blankQuestion()])}>
          Add question
        </Button>
      </div>
    </div>
  );
}

function WindowBound({
  label,
  date,
  time,
  onDate,
  onTime,
}: {
  label: string;
  date: string;
  time: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-bold text-[var(--ink-soft)]">{label}</p>
      <div className="mt-1 flex gap-2">
        <Input type="date" value={date} onChange={(event) => onDate(event.target.value)} />
        <Input type="time" value={time} onChange={(event) => onTime(event.target.value)} />
      </div>
    </div>
  );
}
