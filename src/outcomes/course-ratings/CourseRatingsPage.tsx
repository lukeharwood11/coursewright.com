import { useEffect } from "react";
import { coursePath } from "@/courses/model/paths";
import { courseOutcomesPath } from "@/outcomes/model/paths";
import { OBSERVER_VIEW_ONLY_HINT } from "@/organizations/model/role";
import { ButtonLink } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { RatingMatrix } from "./components/RatingMatrix";
import { useCourseRatings } from "./hooks/useCourseRatings";

export function CourseRatingsPage() {
  const matrix = useCourseRatings();
  useToastOnError(matrix.error);

  useEffect(() => {
    document.title = matrix.course
      ? `Rate outcomes · ${matrix.course.title} · Course Wright`
      : "Rate outcomes · Course Wright";
  }, [matrix.course]);

  if (matrix.loading) return <PageLoading label="Loading ratings…" />;

  if (matrix.notFound || !matrix.course) {
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
        backTo={coursePath(matrix.organization.slug, matrix.course.id)}
        backLabel={`Back to ${matrix.course.title}`}
        title="Rate outcomes"
        description={
          matrix.canEdit
            ? "Choose a rating for each student. Submit when you are ready. Blank cells are allowed."
            : OBSERVER_VIEW_ONLY_HINT
        }
        actions={
          <ButtonLink
            variant="secondary"
            to={courseOutcomesPath(matrix.organization.slug, matrix.course.id)}
          >
            Edit outcomes
          </ButtonLink>
        }
      />
      <div className="px-5 py-6 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">{matrix.course.title}</p>
        <RatingMatrix matrix={matrix} />
      </div>
    </div>
  );
}
