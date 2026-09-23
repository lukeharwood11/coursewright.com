import { quizChoiceLetter } from "@/materials/model/quiz";
import type { QuizQuestionRecord } from "@/quizzes/databridge/quizzes";

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
            {question.kind === "short_answer" ? (
              <p className="text-[14px] text-[var(--ink-soft)]">
                {question.answer.trim() || "Not marked yet"}
              </p>
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
