import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { useCreateResourceMaterial } from "@/materials/material/hooks/useCreateResourceMaterial";
import { LinkResourceDialog } from "./LinkResourceDialog";

const EMPTY_IDS = new Set<number>();

/** Shown only when the course has no live Resources unit. Linking recreates it. */
export function CourseLinkResourceButton({
  organizationId,
  courseId,
}: {
  organizationId: number;
  courseId: number;
}) {
  const [open, setOpen] = useState(false);
  const linkResource = useCreateResourceMaterial({ organizationId, courseId });

  return (
    <div className="mt-3">
      <Button type="button" variant="ghost" fullWidth onClick={() => setOpen(true)}>
        <PlusIcon className="h-5 w-5" aria-hidden />
        Link resource
      </Button>
      <LinkResourceDialog
        open={open}
        organizationId={organizationId}
        linkedFolderIds={EMPTY_IDS}
        linkedItemIds={EMPTY_IDS}
        onClose={() => setOpen(false)}
        onLinkFolder={(folderId) => linkResource.mutate({ folderId })}
        onLinkItem={(itemId) => linkResource.mutate({ itemId })}
        pending={linkResource.isPending}
        error={linkResource.error?.message ?? null}
      />
    </div>
  );
}
