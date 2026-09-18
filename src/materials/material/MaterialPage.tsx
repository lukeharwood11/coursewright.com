import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PrinterIcon, ShareIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Badge } from "@/ui/Badge";
import { Button, ButtonLink } from "@/ui/Button";
import { formatIsoDate } from "@/courses/model/dates";
import { coursePath } from "@/courses/model/paths";
import { materialKindLabel } from "@/materials/model/kind";
import { materialEditPath, materialPrintPath } from "@/materials/model/paths";
import { isPublished } from "@/materials/model/visibility";
import { pageHasContent } from "@/materials/model/pageContent";
import { resourceShareMessage } from "@/sharing/model/copyLink";
import { createResourceShareLink } from "@/sharing/databridge/shareLinks";
import { unitPath } from "@/units/model/paths";
import { useMaterial } from "./hooks/useMaterial";
import { FileMaterialBody } from "./components/FileMaterialBody";
import { VisibilityBanner } from "./components/VisibilityBanner";
import { PageContentView } from "./components/PageContentView";

export function MaterialPage() {
  const page = useMaterial();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = page.material
      ? `${page.material.title} · Course Wright`
      : "Material · Course Wright";
  }, [page.material]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading material…</p>
      </div>
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

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.material.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="slate">{materialKindLabel(page.material.kind)}</Badge>
            {page.importantNow ? (
              <Badge variant="amberSolid">Important now</Badge>
            ) : null}
            {!isPublished(page.material.visibility) ? (
              <Badge variant="amber">Unpublished</Badge>
            ) : null}
            {page.material.scheduledDate ? (
              <span className="text-[12px] font-bold text-[var(--amber-deep)]">
                {formatIsoDate(page.material.scheduledDate)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
            {page.course.title}
            {page.unit ? ` · ${page.unit.title}` : ""}
          </p>
          <p className="mt-3 text-[13px]">
            {page.unit ? (
              <Link
                to={unitPath(page.organization.slug, page.course.id, page.unit.id)}
                className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Back to {page.unit.title}
              </Link>
            ) : (
              <Link
                to={coursePath(page.organization.slug, page.course.id)}
                className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                Back to {page.course.title}
              </Link>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            <ButtonLink to={editHref}>Edit</ButtonLink>
          ) : null}
        </div>
      </div>

      {page.material.description ? (
        <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          {page.material.description}
        </p>
      ) : null}

      {!page.material.deletedAt ? (
        <VisibilityBanner
          visibility={page.material.visibility}
          canEdit={page.canEdit}
          pending={page.setVisibility.isPending}
          onPublish={() => page.setVisibility.mutate("published")}
          onUnpublish={() => page.setVisibility.mutate("unpublished")}
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

      <div className="mt-6">
        <MaterialBody page={page} />
      </div>

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
              onClick={() => {
                if (!window.confirm("Remove this material? You can restore it later.")) {
                  return;
                }
                page.remove.mutate(undefined, {
                  onSuccess: () =>
                    navigate(
                      page.unit
                        ? unitPath(
                            page.organization.slug,
                            page.course!.id,
                            page.unit.id,
                          )
                        : coursePath(page.organization.slug, page.course!.id),
                    ),
                });
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}

      {page.error ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]">{page.error}</p>
      ) : null}
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
      />
    );
  }

  if (page.blocks.length === 0 || !pageHasContent(page.blocks)) {
    return (
      <p className="text-[14.5px] text-[var(--ink-soft)]">
        This page doesn’t have any content yet.
        {page.canEdit ? " Open Edit to add text or a video." : ""}
      </p>
    );
  }

  return (
    <PageContentView
      blocks={page.blocks}
      viewKey={`${material.id}-${page.blocks.map((block) => block.id).join("-")}`}
    />
  );
}
