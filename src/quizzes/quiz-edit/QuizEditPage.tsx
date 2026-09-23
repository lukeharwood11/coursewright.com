import { Link } from "react-router-dom";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { QuizEditorForm } from "./components/QuizEditorForm";
import { useQuizEdit } from "./hooks/useQuizEdit";

const FORM_ID = "quiz-edit-form";

export function QuizEditPage() {
  const page = useQuizEdit();
  useToastOnError(page.loadError);

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
          <Link to={page.viewPath} className="font-bold text-[var(--green)]">
            Back to quiz
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <DetailPageHeader
        backTo={page.viewPath}
        backLabel="Back to quiz"
        title="Edit quiz"
        actions={
          <PageFormActions
            formId={FORM_ID}
            saving={page.saving}
            hasChanges={page.hasChanges}
            cancelTo={page.viewPath}
            saveLabel={page.saving ? "Saving…" : "Save"}
          />
        }
      />
      <form
        id={FORM_ID}
        className="px-5 py-6 md:px-8"
        onSubmit={(event) => {
          event.preventDefault();
          page.save();
        }}
      >
        {page.saveError ? (
          <p className="mb-4 text-[14px] text-[var(--amber-deep)]">{page.saveError}</p>
        ) : null}
        <QuizEditorForm
          title={page.title}
          description={page.description}
          windowFields={page.windowFields}
          allowMultiple={page.allowMultiple}
          autograde={page.autograde}
          shareKey={page.shareKey}
          questions={page.questions}
          onTitle={page.setTitle}
          onDescription={page.setDescription}
          onWindow={page.setWindowFields}
          onAllowMultiple={page.setAllowMultiple}
          onAutograde={page.setAutograde}
          onShareKey={page.setShareKey}
          onQuestions={page.setQuestions}
        />
      </form>
    </div>
  );
}
