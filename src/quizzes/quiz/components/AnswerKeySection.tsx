import { quizChoiceLetter } from "@/materials/model/quiz";
import type { QuizQuestionRecord } from "@/quizzes/databridge/quizzes";
import { matchKeyTexts, matchLayout } from "@/quizzes/model/quiz";

export function AnswerKeySection({ questions }: { questions: QuizQuestionRecord[] }) {
  return (
    <section className="mt-8 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Answer key</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {questions.map((question, index) => (
          <li key={question.id}>
            <p className="text-[14.5px] font-bold text-[var(--ink)]">
              {index + 1}. {question.prompt.trim() || "Question"}
            </p>
            {question.kind === "short_answer" || question.kind === "long_answer" || question.kind === "number" ? (
              <p className="text-[14px] text-[var(--ink-soft)]">
                {question.answer.trim() || "Not marked yet"}
                {question.kind === "long_answer"
                  ? ` · ${question.answerLines ?? 4} lines`
                  : ""}
              </p>
            ) : question.kind === "matching" ? (
              <MatchingKey question={question} />
            ) : (
              <p className="text-[14px] text-[var(--ink-soft)]">
                {question.choices
                  .filter((choice) => choice.text.trim() !== "")
                  .flatMap((choice, choiceIndex) =>
                    choice.correct ? [`${quizChoiceLetter(choiceIndex)}. ${choice.text}`] : [],
                  )
                  .join(", ") || "Not marked yet"}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function MatchingKey({ question }: { question: QuizQuestionRecord }) {
  const layout = matchLayout(question.prompts, question.options, question.id);
  const texts = matchKeyTexts(layout, question.matchKeys);
  if (layout.left.length === 0 || texts.size === 0) {
    return <p className="text-[14px] text-[var(--ink-soft)]">Not marked yet</p>;
  }
  return (
    <ul className="mt-1 flex flex-col gap-1 text-[14px] text-[var(--ink-soft)]">
      {layout.left.map((item) => (
        <li key={item.id}>
          {item.text} → {texts.get(item.id) ?? "—"}
        </li>
      ))}
    </ul>
  );
}
