import { Button } from "@/ui/Button";
import {
  isCoursePublished,
  type CourseVisibility,
} from "@/courses/model/visibility";

/** Warning + Publish only when unpublished. Published state uses a title badge. */
export function CourseVisibilityBanner({
  visibility,
  canEdit,
  pending,
  onPublish,
}: {
  visibility: CourseVisibility;
  canEdit: boolean;
  pending?: boolean;
  onPublish: () => void;
}) {
  if (!canEdit || isCoursePublished(visibility)) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] px-4 py-3">
      <p className="text-[13.5px] text-[var(--amber-deep)]">
        Unpublished. Families can’t see this course until you publish it.
      </p>
      <Button type="button" disabled={pending} onClick={onPublish}>
        Publish
      </Button>
    </div>
  );
}

/** Unpublish control for course settings. */
export function CourseUnpublishControl({
  visibility,
  canEdit,
  pending,
  onUnpublish,
}: {
  visibility: CourseVisibility;
  canEdit: boolean;
  pending?: boolean;
  onUnpublish: () => void;
}) {
  if (!canEdit || !isCoursePublished(visibility)) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-4">
      <div>
        <p className="text-[13px] font-bold text-[var(--ink-soft)]">Visibility</p>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          Families can see this course. Unpublish to hide it again.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={onUnpublish}
      >
        Unpublish
      </Button>
    </div>
  );
}
