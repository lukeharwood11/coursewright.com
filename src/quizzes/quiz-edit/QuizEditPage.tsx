import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { DescriptionDialog } from "@/ui/DescriptionDialog";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import { useSaveShortcut } from "@/ui/useSaveShortcut";
import { useToastOnError } from "@/ui/useToastOnError";
import {
  quizLocationState,
  quizOpenedFromUnit,
} from "@/quizzes/model/navigation";
import { QuizEditHeaderActions } from "./components/QuizEditHeaderActions";
import { QuizEditorForm } from "./components/QuizEditorForm";
import { useQuizEdit } from "./hooks/useQuizEdit";

const FORM_ID = "quiz-edit-form";

const titleInputClass = [
  "min-w-0 flex-1 truncate rounded-[6px] border border-transparent bg-transparent px-2 py-1.5 text-left text-[18px] font-semibold text-[var(--ink)] outline-none md:text-[20px]",
  "placeholder:text-[var(--ink-faint)]",
  "hover:bg-[var(--paper)]",
  "focus:border-[var(--green)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function QuizEditPage() {
  const page = useQuizEdit();
  const location = useLocation();
  const navigate = useNavigate();
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const quizNavState = quizLocationState(quizOpenedFromUnit(location.state));
  useToastOnError(page.loadError);
  useToastOnError(page.saveError);
  useSaveShortcut(() => {
    if (page.saving || !page.hasChanges) return;
    void page.save();
  }, !page.loading && page.canEdit);

  useEffect(() => {
    document.title = page.quiz
      ? `Edit ${page.quiz.title} · Course Wright`
      : "Edit quiz · Course Wright";
  }, [page.quiz]);

  if (page.loading) return <PageLoading label="Loading quiz…" />;

  if (!page.quiz || !page.canEdit) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You can’t edit that quiz
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={page.viewPath}
            state={quizNavState}
            className="font-bold text-[var(--green)]"
          >
            Back to quiz
          </Link>
        </p>
      </div>
    );
  }

  const descriptionLabel = page.description.trim()
    ? "Edit description"
    : "Add description";

  return (
    <>
      <form
        id={FORM_ID}
        className="flex min-h-full flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void page.save();
        }}
      >
        <header className="shrink-0 border-b border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={page.viewPath}
              state={quizNavState}
              className="inline-flex shrink-0 items-center justify-center rounded-[6px] p-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label="Back to quiz"
              title="Back to quiz"
              onClick={(event) => {
                event.preventDefault();
                void page.commitTitle().then(() =>
                  navigate(
                    page.viewPath,
                    quizNavState ? { state: quizNavState } : undefined,
                  ),
                );
              }}
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden />
            </Link>
            <Input
              className={titleInputClass}
              style={{ fontFamily: "var(--font-display)" }}
              value={page.title}
              aria-label="Title"
              placeholder="Untitled"
              onChange={(event) => page.setTitle(event.target.value)}
              onBlur={() => {
                void page.commitTitle();
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                void page.commitTitle().then(() => {
                  (event.target as HTMLInputElement).blur();
                });
              }}
            />
            <QuizEditHeaderActions
              formId={FORM_ID}
              saving={page.saving}
              hasChanges={page.hasChanges}
              cancelTo={page.viewPath}
              cancelState={quizNavState}
              descriptionLabel={descriptionLabel}
              onDescription={() => setDescriptionOpen(true)}
              commitTitle={page.commitTitle}
              onSaveAndClose={async () => {
                const ok = await page.save();
                if (!ok) return;
                navigate(
                  page.viewPath,
                  quizNavState ? { state: quizNavState } : undefined,
                );
              }}
            />
          </div>
        </header>
        <div className="px-5 py-6 md:px-8">
          <QuizEditorForm
            acceptEntries={page.acceptEntries}
            windowFields={page.windowFields}
            allowMultiple={page.allowMultiple}
            autograde={page.autograde}
            shareKey={page.shareKey}
            questions={page.questions}
            onAcceptEntries={page.setAcceptEntries}
            onWindow={page.setWindowFields}
            onAllowMultiple={page.setAllowMultiple}
            onAutograde={page.setAutograde}
            onShareKey={page.setShareKey}
            onQuestions={page.setQuestions}
          />
        </div>
      </form>

      <DescriptionDialog
        open={descriptionOpen}
        value={page.description}
        placeholder="Short note people see with this quiz"
        onClose={() => setDescriptionOpen(false)}
        onSave={page.setDescription}
      />
    </>
  );
}
