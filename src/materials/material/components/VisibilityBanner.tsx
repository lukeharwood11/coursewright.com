import { Button } from "@/ui/Button";
import {
  isPublished,
  type MaterialVisibility,
} from "@/materials/model/visibility";

export function VisibilityBanner({
  visibility,
  canEdit,
  pending,
  onPublish,
  onUnpublish,
}: {
  visibility: MaterialVisibility;
  canEdit: boolean;
  pending?: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
}) {
  if (!canEdit) return null;

  if (isPublished(visibility)) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3">
        <p className="text-[13.5px] text-[var(--ink-soft)]">
          Families can see this.
        </p>
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

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] px-4 py-3">
      <p className="text-[13.5px] text-[var(--amber-deep)]">
        Unpublished. Families can’t see this until you publish it.
      </p>
      <Button type="button" disabled={pending} onClick={onPublish}>
        Publish
      </Button>
    </div>
  );
}
