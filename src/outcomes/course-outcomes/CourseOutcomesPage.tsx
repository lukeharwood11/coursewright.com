import { useEffect } from "react";
import { coursePath } from "@/courses/model/paths";
import { OBSERVER_VIEW_ONLY_HINT } from "@/organizations/model/role";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { OutcomeEditor } from "./components/OutcomeEditor";
import { useCourseOutcomes } from "./hooks/useCourseOutcomes";

export function CourseOutcomesPage() {
  const editor = useCourseOutcomes();
  useToastOnError(editor.error);

  useEffect(() => {
    document.title = editor.course
      ? `Outcomes · ${editor.course.title} · Course Wright`
      : "Outcomes · Course Wright";
  }, [editor.course]);

  if (editor.loading) return <PageLoading label="Loading outcomes…" />;

  if (editor.notFound || !editor.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
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
        title="Outcomes"
        description={
          editor.canEdit
            ? "Goals for this course. Teachers rate these later. Comments for a marking period are separate."
            : OBSERVER_VIEW_ONLY_HINT
        }
      />
      <div className="px-5 py-6 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">{editor.course.title}</p>
        <OutcomeEditor editor={editor} />
      </div>
    </div>
  );
}
