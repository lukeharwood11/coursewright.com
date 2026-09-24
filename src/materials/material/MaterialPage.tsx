import { useEffect, lazy, Suspense, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PencilSquareIcon, PrinterIcon, ShareIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Badge } from "@/ui/Badge";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { useToastOnError } from "@/ui/useToastOnError";
import { formatIsoDate } from "@/courses/model/dates";
import { formatDueDeadline } from "@/submissions/model/dueInstant";
import { MaterialSubmissionsSection } from "@/submissions";
import { SubmissionGrading } from "@/submissions/turn-in/components/SubmissionGrading";
import { coursePath } from "@/courses/model/paths";
import { materialKindLabel } from "@/materials/model/kind";
import {
  materialBackDestination,
  materialLocationState,
  materialOpenedFromUnit,
} from "@/materials/model/navigation";
import { materialEditPath, materialPrintPath } from "@/materials/model/paths";
import { isPublished } from "@/materials/model/visibility";
import { pageHasContent } from "@/materials/model/pageContent";
import { resourceShareMessage } from "@/sharing/model/copyLink";
import { createResourceShareLink } from "@/sharing/databridge/shareLinks";
import { useMaterial } from "./hooks/useMaterial";
import { FileMaterialBody } from "./components/FileMaterialBody";
import {
  UnpublishControl,
  VisibilityBanner,
} from "./components/VisibilityBanner";

const PageContentView = lazy(async () => {
  const module = await import("./components/PageContentView");
  return { default: module.PageContentView };
});

export function MaterialPage() {
  const page = useMaterial();
  const location = useLocation();
  const navigate = useNavigate();
  const [confirmRemove, setConfirmRemove] = useState(false);
  useToastOnError(page.error);

  useEffect(() => {
    document.title = page.material
      ? `${page.material.title} · Course Wright`
      : "Material · Course Wright";
  }, [page.material]);

  if (page.loading) {
    return (
      <PageLoading label="Loading material…" />
    );
  }

  if (page.notFound || !page.material || !page.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that material
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={
              page.isParent
                ? `/my/${page.organization.slug}`
                : coursePath(page.organization.slug, page.courseId)
            }
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back
          </Link>
        </p>
      </div>
    );
  }

  const printHref = materialPrintPath({
    orgSlug: page.organization.slug,
    courseId: page.course.id,
    unitId: page.material.unitId,
    materialId: page.material.id,
  });
  const editHref = materialEditPath({
    orgSlug: page.organization.slug,
    courseId: page.course.id,
    unitId: page.material.unitId,
    materialId: page.material.id,
  });
  const fromUnit = materialOpenedFromUnit(location.state);
  const materialNavState = materialLocationState(fromUnit);
  const back = materialBackDestination({
    fromUnit,
    orgSlug: page.organization.slug,
    courseId: page.course.id,
    courseTitle: page.course.title,
    unit: page.unit,
  });

  return (
    <div>
      <DetailPageHeader
        backTo={back.to}
        backLabel={back.label}
        title={page.material.title}
        meta={
          <>
            <Badge variant="slate">{materialKindLabel(page.material.kind)}</Badge>
            {page.importantNow ? (
              <Badge variant="amberSolid">Important now</Badge>
            ) : null}
            {isPublished(page.material.visibility) ? (
              page.canEdit ? <PublishedBadge /> : null
            ) : (
              <Badge variant="amber">Unpublished</Badge>
            )}
            {page.material.scheduledDate ? (
              <span className="text-[12px] font-bold text-[var(--slate)]">
                Assigned {formatIsoDate(page.material.scheduledDate)}
              </span>
            ) : null}
            {page.material.dueDate ? (
              <span className="text-[12px] font-bold text-[var(--amber-deep)]">
                Due{" "}
                {page.material.dueAt && page.material.dueTimezone
                  ? formatDueDeadline(page.material.dueAt, page.material.dueTimezone)
                  : formatIsoDate(page.material.dueDate)}
              </span>
            ) : null}
          </>
        }
        description={
          <p className="text-[13.5px] text-[var(--ink-soft)]">
            {page.course.title}
            {page.unit ? ` · ${page.unit.title}` : ""}
          </p>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await createResourceShareLink({
                    organizationId: page.organization.id,
                    courseId: page.course!.id,
                    materialId: page.material!.id,
                  });
                } catch {
                  /* Copying the signed-in URL still works if the row fails. */
                }
                await navigator.clipboard.writeText(window.location.href);
                toast(resourceShareMessage(page.material!.visibility));
              }}
            >
              <ShareIcon className="h-5 w-5" aria-hidden />
              Share
            </Button>
            <ButtonLink variant="secondary" to={printHref}>
              <PrinterIcon className="h-5 w-5" aria-hidden />
              Print
            </ButtonLink>
            {page.canEdit && !page.material.deletedAt ? (
              <ButtonLink to={editHref} state={materialNavState}>
                <PencilSquareIcon className="h-5 w-5" aria-hidden />
                Edit
              </ButtonLink>
            ) : null}
          </>
        }
      />
      <div className="px-5 py-6 md:px-8">
      {page.material.description ? (
        <p className="max-w-2xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          {page.material.description}
        </p>
      ) : null}

      {!page.material.deletedAt ? (
        <VisibilityBanner
          visibility={page.material.visibility}
          canEdit={page.canEdit}
          pending={page.setVisibility.isPending}
          onPublish={() => page.setVisibility.mutate("published")}
        />
      ) : null}

      {page.material.deletedAt ? (
        <div className="mt-4 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] p-4">
          <p className="text-[14px] text-[var(--amber-deep)]">
            This material was removed. Restore it to show it on the course again.
          </p>
          {page.canEdit ? (
            <div className="mt-3">
              <Button onClick={() => page.restore.mutate()}>Restore</Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <MaterialBody page={page} />

          {page.canEdit ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => page.toggleImportant.mutate(!page.importantNow)}
              >
                {page.importantNow ? "Remove important now" : "Mark important now"}
              </Button>
              {!page.material.deletedAt ? (
                <Button
                  variant="secondary"
                  onClick={() => setConfirmRemove(true)}
                  disabled={page.remove.isPending}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}

          {page.canEdit && !page.material.deletedAt ? (
            <SubmissionGrading material={page.material} courseId={page.material.courseId} />
          ) : null}

          {!page.material.deletedAt ? (
            <UnpublishControl
              visibility={page.material.visibility}
              canEdit={page.canEdit}
              pending={page.setVisibility.isPending}
              onUnpublish={() => page.setVisibility.mutate("unpublished")}
            />
          ) : null}
        </div>

        {!page.material.deletedAt && page.material.courseId ? (
          <MaterialSubmissionsSection
            material={page.material}
            courseId={page.material.courseId}
            mode={page.isParent || !page.canEdit ? "family" : "staff"}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this material?"
        body="It won’t show on the course anymore. You can restore it later if you need it again."
        confirmLabel={page.remove.isPending ? "Removing…" : "Remove"}
        cancelLabel="Keep it"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          page.remove.mutate(undefined, {
            onSuccess: () => navigate(back.to),
          });
        }}
      />
      </div>
    </div>
  );
}

function MaterialBody({
  page,
}: {
  page: ReturnType<typeof useMaterial>;
}) {
  const material = page.material;
  if (!material) return null;

  if (material.kind === "link") {
    return (
      <p>
        <a
          href={material.url ?? "#"}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          target="_blank"
          rel="noreferrer"
        >
          {material.url}
        </a>
      </p>
    );
  }

  if (material.kind === "file") {
    if (!page.file) {
      return <p className="text-[14px] text-[var(--ink-soft)]">No file attached.</p>;
    }
    return (
      <FileMaterialBody
        file={page.file}
        fileUrl={page.fileUrl}
        fileDownloadUrl={page.fileDownloadUrl}
        onRetryFileUrl={page.retryFileUrl}
      />
    );
  }

  if (page.blocks.length === 0 || !pageHasContent(page.blocks)) {
    return (
      <p className="text-[14.5px] text-[var(--ink-soft)]">
        This page doesn’t have any content yet.
        {page.canEdit ? " Open Edit to add text, a video, or a quiz." : ""}
      </p>
    );
  }

  return (
    <Suspense
      fallback={<PageLoading embedded label="Loading page…" />}
    >
      <PageContentView
        blocks={page.blocks}
        viewKey={`${material.id}-${page.blocks.map((block) => block.id).join("-")}`}
        showAnswers={page.canEdit}
      />
    </Suspense>
  );
}
