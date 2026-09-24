import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PencilSquareIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { useToastOnError } from "@/ui/useToastOnError";
import { FileMaterialBody } from "@/materials/material/components/FileMaterialBody";
import {
  UnpublishControl,
  VisibilityBanner,
} from "@/materials/material/components/VisibilityBanner";
import { AccessSettingsDialog } from "@/resources/resources/components/AccessSettingsDialog";
import { MoveResourceDialog } from "@/resources/resources/components/MoveResourceDialog";
import { ResourceActionsMenu } from "./components/ResourceActionsMenu";
import { useResource } from "./hooks/useResource";
import {
  isPublishedResource,
  resourceItemTypeLabel,
} from "@/resources/model/kinds";
import {
  resourceBrowsePath,
  resourceItemEditPath,
  resourceItemPrintPath,
} from "@/resources/model/paths";

const PageContentView = lazy(async () => {
  const module = await import("@/materials/material/components/PageContentView");
  return { default: module.PageContentView };
});

export function ResourcePage() {
  const page = useResource();
  const navigate = useNavigate();
  const [accessOpen, setAccessOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  useToastOnError(page.error);

  useEffect(() => {
    document.title = page.item
      ? `${page.item.title} · Resources · Course Wright`
      : "Resource · Course Wright";
  }, [page.item]);

  if (page.loading) {
    return <PageLoading label="Loading resource…" />;
  }

  if (page.notFound || !page.item) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that resource
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={resourceBrowsePath(page.organization.slug, null)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to Resources
          </Link>
        </p>
      </div>
    );
  }

  const backFolderId =
    page.item.folderId != null && page.folder == null ? null : page.item.folderId;
  const backTo = resourceBrowsePath(page.organization.slug, backFolderId);
  const backLabel = page.folder?.name ?? "Resources";

  return (
    <div>
      <DetailPageHeader
        backTo={backTo}
        backLabel={backLabel}
        title={page.item.title}
        titleTrailing={
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            {page.item.type !== "link" ? (
              <ButtonLink
                variant="secondary"
                className={[
                  "shrink-0",
                  page.canEdit ? "max-xl:hidden" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                to={resourceItemPrintPath(page.organization.slug, page.item.id)}
              >
                <PrinterIcon className="h-5 w-5" aria-hidden />
                Print
              </ButtonLink>
            ) : null}
            {page.canEdit ? (
              <ButtonLink
                variant="secondary"
                className="max-xl:hidden shrink-0"
                to={resourceItemEditPath(page.organization.slug, page.item.id)}
              >
                <PencilSquareIcon className="h-5 w-5" aria-hidden />
                Edit
              </ButtonLink>
            ) : null}
            {page.canEdit ? (
              <ResourceActionsMenu
                orgSlug={page.organization.slug}
                itemId={page.item.id}
                itemType={page.item.type}
                isStaff={page.isStaff}
                onMove={() => setMoveOpen(true)}
                onAccess={() => setAccessOpen(true)}
                onRemove={() => setConfirmRemove(true)}
              />
            ) : null}
          </div>
        }
        meta={
          <>
            <Badge variant="slate">{resourceItemTypeLabel(page.item.type)}</Badge>
            {isPublishedResource(page.item.visibility) ? (
              page.canEdit ? <PublishedBadge /> : null
            ) : (
              <Badge variant="amber">Unpublished</Badge>
            )}
          </>
        }
        description={
          page.item.description ? (
            <p className="text-[14px] text-[var(--ink-soft)]">{page.item.description}</p>
          ) : null
        }
      />

      <div className="px-5 py-6 md:px-8">
        <VisibilityBanner
          visibility={page.item.visibility}
          canEdit={page.canEdit}
          pending={page.visibilityPending}
          onPublish={() => page.publish()}
        />

        {page.item.type === "document" ? (
          <Suspense fallback={<PageLoading embedded label="Loading page…" />}>
            <div className="mt-4">
              <PageContentView
                blocks={page.blocks}
                viewKey={`resource-${page.item.id}`}
                showAnswers={page.isStaff}
              />
            </div>
          </Suspense>
        ) : null}

        {page.item.type === "link" && page.item.url ? (
          <p className="mt-4">
            <a
              href={page.item.url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              {page.item.url}
            </a>
          </p>
        ) : null}

        {page.item.type === "file" && page.file ? (
          <div className="mt-4">
            <FileMaterialBody
              file={page.file}
              fileUrl={page.fileUrl}
              fileDownloadUrl={page.fileDownloadUrl}
            />
          </div>
        ) : null}

        <UnpublishControl
          visibility={page.item.visibility}
          canEdit={page.canEdit}
          pending={page.visibilityPending}
          onUnpublish={() => page.unpublish()}
        />
      </div>

      <MoveResourceDialog
        open={moveOpen}
        organizationId={page.organization.id}
        currentFolderId={page.item.folderId}
        onClose={() => setMoveOpen(false)}
        pending={page.move.isPending}
        error={page.move.error?.message ?? null}
        onMove={(folderId) => {
          void page.move.mutateAsync(folderId).then(() => setMoveOpen(false));
        }}
      />
      <AccessSettingsDialog
        open={accessOpen}
        target={{
          kind: "item",
          id: page.item.id,
          organizationId: page.organization.id,
          canInherit: true,
        }}
        audience={{
          parentsCanView: page.item.parentsCanView,
          studentsCanView: page.item.studentsCanView,
        }}
        aclInherit={page.item.aclInherit}
        parentId={null}
        folderId={page.item.folderId}
        unpublished={page.item.visibility !== "published"}
        onClose={() => setAccessOpen(false)}
        onSaved={page.invalidate}
      />
      <ConfirmDialog
        open={confirmRemove}
        title="Remove this resource?"
        body="It will be hidden from Resources. You can still ask an admin if you need it back."
        confirmLabel="Remove"
        cancelLabel="Keep"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          void page.archive.mutateAsync().then(() => navigate(backTo));
        }}
      />
    </div>
  );
}
