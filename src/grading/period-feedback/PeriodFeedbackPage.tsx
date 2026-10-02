import { useEffect } from "react";
import { coursePath } from "@/courses/model/paths";
import { OBSERVER_VIEW_ONLY_HINT } from "@/organizations/model/role";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { PeriodFeedbackForm } from "./components/PeriodFeedbackForm";
import { usePeriodFeedback } from "./hooks/usePeriodFeedback";

export function PeriodFeedbackPage() {
  const editor = usePeriodFeedback();
  useToastOnError(editor.error);

  useEffect(() => {
    document.title = editor.course
      ? `Period feedback · ${editor.course.title} · Course Wright`
      : "Period feedback · Course Wright";
  }, [editor.course]);

  if (editor.loading) return <PageLoading label="Loading period feedback…" />;

  if (editor.notFound || !editor.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1 className="text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          We couldn’t find that course
        </h1>
      </div>
    );
  }

  return (
    <div>
      <DetailPageHeader
        backTo={coursePath(editor.organization.slug, editor.course.id)}
        backLabel={`Back to ${editor.course.title}`}
        title="Period feedback"
        description={
          editor.canEdit
            ? "A comment for each student this marking period. This is separate from outcomes."
            : editor.closed
              ? "This fill cycle is closed. Comments stay as they were."
              : OBSERVER_VIEW_ONLY_HINT
        }
      />
      <div className="px-5 py-6 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">{editor.course.title}</p>
        <PeriodFeedbackForm editor={editor} />
      </div>
    </div>
  );
}
