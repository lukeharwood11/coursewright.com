import { useEffect, lazy, Suspense, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { DescriptionDialog } from "@/ui/DescriptionDialog";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import { useSaveShortcut } from "@/ui/useSaveShortcut";
import { useToastOnError } from "@/ui/useToastOnError";
import { materialLocationState, materialOpenedFromUnit } from "@/materials/model/navigation";
import { materialPath } from "@/materials/model/paths";
import { timeZoneLabel } from "@/submissions/model/dueInstant";
import { useMaterialEdit } from "./hooks/useMaterialEdit";
import { MaterialDateFields } from "./components/MaterialDateFields";
import { MaterialEditFileSection } from "./components/MaterialEditFileSection";
import { MaterialEditHeaderActions } from "./components/MaterialEditHeaderActions";
import { MaterialVersionHistoryDialog } from "./components/MaterialVersionHistoryDialog";
import { PageEditorMediaProvider } from "./components/PageEditorMediaContext";
import { SubmissionSettingsFields } from "./components/SubmissionSettingsFields";
import {
  UnpublishControl,
  VisibilityBanner,
} from "./components/VisibilityBanner";

const PageContentEditor = lazy(async () => {
  const module = await import("./components/PageContentEditor");
  return { default: module.PageContentEditor };
});

const titleInputClass = [
  "min-w-0 flex-1 truncate rounded-[6px] border border-transparent bg-transparent px-2 py-1.5 text-left text-[18px] font-semibold text-[var(--ink)] outline-none md:text-[20px]",
  "placeholder:text-[var(--ink-faint)]",
  "hover:bg-[var(--paper)]",
  "focus:border-[var(--green)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function MaterialEditPage() {
  const edit = useMaterialEdit();
  const page = edit.page;
  const location = useLocation();
  const navigate = useNavigate();
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  useToastOnError(edit.error ?? page.error);
  useSaveShortcut(() => {
    if (edit.saving || !edit.hasChanges || !edit.canSave) return;
    void edit.save();
  });

  useEffect(() => {
    document.title = page.material
      ? `Edit ${page.material.title} · Course Wright`
      : "Edit material · Course Wright";
  }, [page.material]);

  const materialNavState = materialLocationState(
    materialOpenedFromUnit(location.state),
  );

  if (!page.canEdit && !page.loading && page.material && page.course) {
    return (
      <Navigate
        to={materialPath({
          orgSlug: page.organization.slug,
          courseId: page.course.id,
          unitId: page.material.unitId,
          materialId: page.material.id,
        })}
        state={materialNavState}
        replace
      />
    );
  }

  if (page.loading || (page.material?.kind === "page" && page.blocksLoading)) {
    return <PageLoading label="Loading editor…" />;
  }

  if (page.notFound || !page.material || !page.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          We couldn’t open that editor.
        </p>
      </div>
    );
  }

  const viewHref = materialPath({
    orgSlug: page.organization.slug,
    courseId: page.course.id,
    unitId: page.material.unitId,
    materialId: page.material.id,
  });
  const descriptionLabel = edit.description.trim()
    ? "Edit description"
    : "Add description";

  return (
    <>
      <form
        id={edit.formId}
        className="flex min-h-full flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          void edit.save();
        }}
      >
        <header className="shrink-0 border-b border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              to={viewHref}
              state={materialNavState}
              className="inline-flex shrink-0 items-center justify-center rounded-[6px] p-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label="Back to material"
              title="Back to material"
              onClick={(event) => {
                event.preventDefault();
                void edit.commitTitle().then(() =>
                  navigate(
                    viewHref,
                    materialNavState ? { state: materialNavState } : undefined,
                  ),
                );
              }}
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden />
            </Link>
            <Input
              className={titleInputClass}
              style={{ fontFamily: "var(--font-display)" }}
              value={edit.title}
              aria-label="Title"
              placeholder="Untitled"
              onChange={(event) => edit.setTitle(event.target.value)}
              onBlur={() => {
                void edit.commitTitle();
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                void edit.commitTitle().then(() => {
                  (event.target as HTMLInputElement).blur();
                });
              }}
            />
            <MaterialEditHeaderActions
              formId={edit.formId}
              saving={edit.saving}
              hasChanges={edit.hasChanges}
              canSave={edit.canSave}
              cancelTo={viewHref}
              cancelState={materialNavState}
              descriptionLabel={descriptionLabel}
              onDescription={() => setDescriptionOpen(true)}
              onVersionHistory={
                page.material.kind === "page"
                  ? undefined
                  : () => setHistoryOpen(true)
              }
              versionHistoryDisabled={page.versions.length === 0}
              commitTitle={edit.commitTitle}
              onSaveAndClose={async () => {
                const ok = await edit.save();
                if (!ok) return;
                navigate(
                  viewHref,
                  materialNavState ? { state: materialNavState } : undefined,
                );
              }}
            />
          </div>
          {page.material.kind === "link" ? (
            <label className="mt-2 block pl-7 text-[12px] font-bold text-[var(--ink-soft)]">
              Web address
              <Input
                className="mt-1 w-full max-w-xl text-[13.5px]"
                value={edit.url}
                placeholder="https://"
                onChange={(event) => edit.setUrl(event.target.value)}
              />
            </label>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {!page.material.deletedAt ? (
            <div className="px-5 pt-4 md:px-8">
              <VisibilityBanner
                visibility={page.material.visibility}
                canEdit={page.canEdit}
                pending={page.setVisibility.isPending}
                onPublish={() => page.setVisibility.mutate("published")}
              />
            </div>
          ) : null}

          {page.material.kind === "page" ? (
            <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:px-6 md:py-4 lg:px-8">
              <PageEditorMediaProvider
                value={{
                  organizationId: page.organization.id,
                  userId: page.userId,
                }}
              >
                <Suspense fallback={<PageLoading embedded label="Loading editor…" />}>
                  <div className="min-h-[calc(100dvh-14rem)] flex-1 [&_.cw-editor-shell]:min-h-[calc(100dvh-14rem)] [&_.cw-editor-input]:min-h-[calc(100dvh-18rem)]">
                    <PageContentEditor
                      blocks={page.blocks}
                      editorKey={`${page.material.id}-${edit.editorEpoch}`}
                      editable
                      onDraftChange={edit.onDraftChange}
                      onVersionHistory={() => setHistoryOpen(true)}
                      versionHistoryDisabled={page.versions.length === 0}
                    />
                  </div>
                </Suspense>
              </PageEditorMediaProvider>
            </div>
          ) : null}

          {page.material.kind === "file" && page.file ? (
            <div className="px-5 py-4 md:px-8">
              <MaterialEditFileSection
                organizationId={page.organization.id}
                fileId={page.file.id}
                filename={page.file.filename}
                onChange={page.invalidate}
              />
            </div>
          ) : null}

          {page.material.kind === "link" ? (
            <p className="px-5 py-4 text-[14px] text-[var(--ink-soft)] md:px-8">
              People open this web address from the material. Save when the
              description, dates, or address is ready.
            </p>
          ) : null}

          <div className="px-5 pb-8 md:px-8">
            <div className="max-w-xl">
              <MaterialDateFields
                scheduledDate={edit.scheduledDate}
                dueDate={edit.dueDate}
                dueTime={edit.dueTime}
                timeZoneLabel={timeZoneLabel(edit.dueTimezone)}
                onScheduledChange={edit.setScheduledDate}
                onDueDateChange={edit.setDueDate}
                onDueTimeChange={edit.setDueTime}
              />
              <SubmissionSettingsFields
                acceptSubmissions={edit.acceptSubmissions}
                allowPastDue={edit.allowPastDue}
                gradable={edit.gradable}
                pointsText={edit.pointsText}
                submissionLimit={edit.submissionLimit}
                fileTypes={edit.fileTypes}
                onAcceptChange={edit.setAcceptSubmissions}
                onAllowPastDueChange={edit.setAllowPastDue}
                onGradableChange={edit.setGradable}
                onPointsChange={edit.setPointsText}
                onLimitChange={edit.setSubmissionLimit}
                onToggleType={edit.toggleFileType}
              />
            </div>

            {!page.material.deletedAt ? (
              <UnpublishControl
                visibility={page.material.visibility}
                canEdit={page.canEdit}
                pending={page.setVisibility.isPending}
                onUnpublish={() => page.setVisibility.mutate("unpublished")}
              />
            ) : null}
          </div>
        </div>
      </form>

      <DescriptionDialog
        open={descriptionOpen}
        value={edit.description}
        placeholder="Short note people see with this material"
        onClose={() => setDescriptionOpen(false)}
        onSave={edit.setDescription}
      />

      <MaterialVersionHistoryDialog
        open={historyOpen}
        versions={page.versions}
        restoring={page.revert.isPending}
        onClose={() => setHistoryOpen(false)}
        onRestore={(snapshot) => {
          page.revert.mutate(snapshot, {
            onSuccess: () => {
              edit.afterRestore();
              setHistoryOpen(false);
            },
          });
        }}
      />
    </>
  );
}
