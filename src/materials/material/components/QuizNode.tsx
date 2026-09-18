import type { JSX } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import type { SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";
import {
  $getDocument,
  $getNodeByKey,
  arrayValue,
  booleanValue,
  enumValue,
  nodeSchema,
  objectValue,
  stringValue,
} from "lexical";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import {
  defaultQuizBody,
  emptyQuizChoice,
  parseQuizBody,
  quizChoiceLetter,
  quizCorrectChoiceLetters,
  type QuizBody,
  type QuizChoice,
  type QuizQuestionKind,
} from "@/materials/model/quiz";
import { useShowQuizAnswers } from "./PageQuizViewContext";

export type SerializedQuizNode = Spread<QuizBody, SerializedDecoratorBlockNode>;

const quizChoiceSchema = objectValue({
  id: stringValue(),
  text: stringValue(),
  correct: booleanValue(),
});

const quizNodeSchema = nodeSchema<QuizNode>()({
  prompt: stringValue(),
  questionKind: enumValue(["multiple_choice", "short_answer"]),
  answer: stringValue(),
  choices: arrayValue(quizChoiceSchema),
});

function convertQuizElement(element: HTMLElement): DOMConversionOutput | null {
  const raw = element.getAttribute("data-lexical-quiz");
  if (!raw) return null;
  try {
    return { node: $createQuizNode(parseQuizBody(JSON.parse(raw))) };
  } catch {
    return null;
  }
}

export class QuizNode extends DecoratorBlockNode {
  declare __prompt: string;
  declare __questionKind: QuizQuestionKind;
  declare __choices: QuizChoice[];
  declare __answer: string;

  $config() {
    return this.config("quiz", {
      extends: DecoratorBlockNode,
      json: quizNodeSchema,
    });
  }

  static clone(node: QuizNode): QuizNode {
    return new QuizNode(
      node.__prompt,
      node.__questionKind,
      node.__choices.map((choice) => ({ ...choice })),
      node.__answer,
      node.__key,
    );
  }

  constructor(
    prompt: string = "",
    questionKind: QuizQuestionKind = "multiple_choice",
    choices: QuizChoice[] = [],
    answer: string = "",
    key?: NodeKey,
  ) {
    super(undefined, key);
    this.__prompt = prompt;
    this.__questionKind = questionKind;
    this.__choices = choices;
    this.__answer = answer;
  }

  static importJSON(serializedNode: SerializedQuizNode): QuizNode {
    return $createQuizNode().updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (element: HTMLElement) => {
        if (!element.hasAttribute("data-lexical-quiz")) return null;
        return { conversion: convertQuizElement, priority: 2 };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = $getDocument().createElement("div");
    element.setAttribute(
      "data-lexical-quiz",
      JSON.stringify(parseQuizBody(this.exportJSON())),
    );
    element.textContent = this.getPrompt() || "Quiz";
    return { element };
  }

  getPrompt(): string {
    return this.getLatest().__prompt;
  }

  setPrompt(prompt: string): this {
    const self = this.getWritable();
    self.__prompt = prompt;
    return self;
  }

  getQuestionKind(): QuizQuestionKind {
    return this.getLatest().__questionKind;
  }

  setQuestionKind(questionKind: QuizQuestionKind): this {
    const self = this.getWritable();
    self.__questionKind = questionKind;
    return self;
  }

  getChoices(): QuizChoice[] {
    return this.getLatest().__choices.map((choice) => ({ ...choice }));
  }

  setChoices(choices: QuizChoice[]): this {
    const self = this.getWritable();
    self.__choices = choices.map((choice) => ({ ...choice }));
    return self;
  }

  getAnswer(): string {
    return this.getLatest().__answer;
  }

  setAnswer(answer: string): this {
    const self = this.getWritable();
    self.__answer = answer;
    return self;
  }

  createDOM(): HTMLElement {
    const div = $getDocument().createElement("div");
    div.className = "cw-editor-quiz";
    return div;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <QuizEmbed
        prompt={this.getPrompt()}
        questionKind={this.getQuestionKind()}
        choices={this.getChoices()}
        answer={this.getAnswer()}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createQuizNode(body?: QuizBody): QuizNode {
  const quiz = body ?? defaultQuizBody();
  return new QuizNode(quiz.prompt, quiz.questionKind, quiz.choices, quiz.answer);
}

export function $isQuizNode(
  node: LexicalNode | null | undefined,
): node is QuizNode {
  return node instanceof QuizNode;
}

function QuizEmbed({
  prompt,
  questionKind,
  choices,
  answer,
  nodeKey,
}: {
  prompt: string;
  questionKind: QuizQuestionKind;
  choices: QuizChoice[];
  answer: string;
  nodeKey: string;
}) {
  const [editor] = useLexicalComposerContext();
  const showAnswers = editor.isEditable() || useShowQuizAnswers();
  const quiz = { prompt, questionKind, choices, answer };

  function patch(updater: (node: QuizNode) => void) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isQuizNode(node)) updater(node);
    });
  }

  function stopEditorKeys(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }

  if (editor.isEditable()) {
    return (
      <div
        className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-3"
        onKeyDown={stopEditorKeys}
        onPointerDown={stopEditorKeys}
      >
        <p className="text-[12.5px] font-bold text-[var(--ink-soft)]">Quiz</p>
        <label className="mt-2 block">
          <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
            Question
          </span>
          <textarea
            className="mt-1 min-h-[4.5rem] w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]"
            value={prompt}
            placeholder="Ask the question…"
            onChange={(event) => {
              const next = event.target.value;
              patch((node) => {
                node.setPrompt(next);
              });
            }}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <KindButton
            pressed={questionKind === "multiple_choice"}
            onClick={() => {
              patch((node) => {
                node.setQuestionKind("multiple_choice");
                if (node.getChoices().length === 0) {
                  node.setChoices(defaultQuizBody().choices);
                }
              });
            }}
          >
            Multiple choice
          </KindButton>
          <KindButton
            pressed={questionKind === "short_answer"}
            onClick={() => {
              patch((node) => {
                node.setQuestionKind("short_answer");
              });
            }}
          >
            Short answer
          </KindButton>
        </div>
        {questionKind === "short_answer" ? (
          <label className="mt-3 block">
            <span className="text-[12.5px] font-bold text-[var(--ink-soft)]">
              Correct answer
            </span>
            <Input
              className="mt-1 w-full"
              value={answer}
              placeholder="Printed on the staff answer key"
              onChange={(event) => {
                const next = event.target.value;
                patch((node) => {
                  node.setAnswer(next);
                });
              }}
            />
          </label>
        ) : (
          <div className="mt-3">
            <p className="text-[12.5px] font-bold text-[var(--ink-soft)]">
              Choices
            </p>
            <ul className="mt-2 space-y-2">
              {choices.map((choice, index) => (
                <li key={choice.id} className="flex flex-wrap items-center gap-2">
                  <span className="w-5 text-[13px] font-bold text-[var(--ink-soft)]">
                    {quizChoiceLetter(index)}.
                  </span>
                  <Input
                    className="min-w-[12rem] flex-1 py-2"
                    value={choice.text}
                    placeholder={`Choice ${quizChoiceLetter(index)}`}
                    onChange={(event) => {
                      const next = event.target.value;
                      patch((node) => {
                        node.setChoices(
                          node.getChoices().map((item) =>
                            item.id === choice.id ? { ...item, text: next } : item,
                          ),
                        );
                      });
                    }}
                  />
                  <label className="flex items-center gap-1.5 text-[13px] text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={choice.correct}
                      onChange={(event) => {
                        const next = event.target.checked;
                        patch((node) => {
                          node.setChoices(
                            node.getChoices().map((item) =>
                              item.id === choice.id
                                ? { ...item, correct: next }
                                : item,
                            ),
                          );
                        });
                      }}
                    />
                    Correct
                  </label>
                  {choices.length > 2 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-2.5 py-1.5 text-[12px]"
                      onClick={() => {
                        patch((node) => {
                          node.setChoices(
                            node.getChoices().filter((item) => item.id !== choice.id),
                          );
                        });
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <Button
                type="button"
                variant="secondary"
                className="px-2.5 py-1.5 text-[12px]"
                onClick={() => {
                  patch((node) => {
                    node.setChoices([...node.getChoices(), emptyQuizChoice()]);
                  });
                }}
              >
                Add choice
              </Button>
            </div>
          </div>
        )}
        <div className="mt-3">
          <Button
            type="button"
            variant="secondary"
            className="px-2.5 py-1.5 text-[12px]"
            onClick={() => {
              editor.update(() => {
                $getNodeByKey(nodeKey)?.remove();
              });
            }}
          >
            Remove quiz
          </Button>
        </div>
      </div>
    );
  }

  return <QuizReadView quiz={quiz} showAnswers={showAnswers} />;
}

function QuizReadView({
  quiz,
  showAnswers,
}: {
  quiz: QuizBody;
  showAnswers: boolean;
}) {
  const letters = quizCorrectChoiceLetters(quiz);
  return (
    <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-3">
      <p className="text-[12.5px] font-bold text-[var(--ink-soft)]">
        {showAnswers ? "Quiz · Answer key" : "Quiz"}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-[14.5px] text-[var(--ink)]">
        {quiz.prompt.trim() || "Question"}
      </p>
      {quiz.questionKind === "short_answer" ? (
        showAnswers ? (
          <p className="mt-2 text-[14px] text-[var(--ink)]">
            <span className="font-bold">Answer:</span>{" "}
            {quiz.answer.trim() || "Not marked yet"}
          </p>
        ) : (
          <p className="mt-3 border-b border-[var(--ink)] pb-1 text-[13px] text-[var(--ink-faint)]">
            Write your answer
          </p>
        )
      ) : (
        <ul className="mt-3 space-y-1.5">
          {quiz.choices.map((choice, index) => {
            if (!choice.text.trim() && !showAnswers) return null;
            const mark = showAnswers && choice.correct ? "●" : "○";
            return (
              <li
                key={choice.id}
                className="text-[14.5px] text-[var(--ink)]"
              >
                {mark} {quizChoiceLetter(index)}. {choice.text.trim() || "Empty choice"}
                {showAnswers && choice.correct ? (
                  <span className="ml-1 text-[12.5px] font-bold text-[var(--ink-soft)]">
                    (correct)
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {showAnswers && quiz.questionKind === "multiple_choice" && letters ? (
        <p className="mt-2 text-[13px] text-[var(--ink-soft)]">
          Correct: {letters}
        </p>
      ) : null}
    </div>
  );
}

function KindButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={[
        "rounded-[6px] border px-2.5 py-1.5 text-[12.5px] font-bold",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
        pressed
          ? "border-[var(--green)] bg-[var(--green-tint)] text-[var(--green-deep)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
