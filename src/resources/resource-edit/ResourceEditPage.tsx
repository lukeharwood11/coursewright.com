import { lazy, Suspense, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import { useSaveShortcut } from "@/ui/useSaveShortcut";
import { useToastOnError } from "@/ui/useToastOnError";
import { PageEditorMediaProvider } from "@/materials/material/components/PageEditorMediaContext";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useResourceEdit } from "./hooks/useResourceEdit";
import { ResourceDescriptionDialog } from "./components/ResourceDescriptionDialog";
import { ResourceEditHeaderActions } from "./components/ResourceEditHeaderActions";
import { resourceItemPath } from "@/resources/model/paths";
import { MaterialVersionHistoryDialog } from "@/materials/material/components/MaterialVersionHistoryDialog";
import { previewFromResourceSnapshot } from "@/resources/model/versionSnapshot";

const PageContentEditor = lazy(async () => {
  const module = await import("@/materials/material/components/PageContentEditor");
  return { default: module.PageContentEditor };
});

const titleInputClass = [
  "min-w-0 flex-1 truncate rounded-[6px] border border-transparent bg-transparent px-2 py-1.5 text-left text-[18px] font-semibold text-[var(--ink)] outline-none md:text-[20px]",
  "placeholder:text-[var(--ink-faint)]",
  "hover:bg-[var(--paper)]",
  "focus:border-[var(--green)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function ResourceEditPage() {
  const edit = useResourceEdit();
  const page = edit.page;
  const user = useAuthedUser();
  const navigate = useNavigate();
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  useToastOnError(edit.error ?? page.error);
  useSaveShortcut(() => {
    if (edit.saving || !edit.hasChanges) return;
    void edit.save();
  });

  useEffect(() => {
    document.title = page.item
      ? `Edit ${page.item.title} · Course Wright`
      : "Edit resource · Course Wright";
  }, [page.item]);

  if (!page.canEdit && !page.loading && page.item) {
    return (
      <Navigate
        to={resourceItemPath(page.organization.slug, page.item.id)}
        replace
      />
    );
  }

  if (page.loading || (page.item?.type === "document" && page.blocksLoading)) {
    return <PageLoading label="Loading editor…" />;
  }

  if (page.notFound || !page.item) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          We couldn’t open that editor.
        </p>
      </div>
    );
  }

  const viewHref = resourceItemPath(page.organization.slug, page.item.id);
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
              className="inline-flex shrink-0 items-center justify-center rounded-[6px] p-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label="Back"
              title="Back"
              onClick={(event) => {
                event.preventDefault();
                void edit.commitTitle().then(() => navigate(viewHref));
              }}
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden />
            </Link>
            <Input
              className={titleInputClass}
              style={{ fontFamily: "var(--font-display)" }}
              value={edit.title}
              aria-label="Name"
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
            <ResourceEditHeaderActions
              formId={edit.formId}
              saving={edit.saving}
              hasChanges={edit.hasChanges}
              cancelTo={viewHref}
              descriptionLabel={descriptionLabel}
              onDescription={() => setDescriptionOpen(true)}
              onVersionHistory={
                page.item.type === "document"
                  ? undefined
                  : () => setHistoryOpen(true)
              }
              versionHistoryDisabled={page.versions.length === 0}
              commitTitle={edit.commitTitle}
              onSaveAndClose={async () => {
                const ok = await edit.save();
                if (!ok) return;
                navigate(viewHref);
              }}
            />
          </div>
          {page.item.type === "link" ? (
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

        {page.item.type === "document" ? (
          <div className="flex min-h-0 flex-1 flex-col px-3 py-3 md:px-6 md:py-4 lg:px-8">
            <PageEditorMediaProvider
              value={{ organizationId: page.organization.id, userId: user.id }}
            >
              <Suspense fallback={<PageLoading embedded label="Loading editor…" />}>
                <div className="min-h-[calc(100dvh-10rem)] flex-1 [&_.cw-editor-shell]:min-h-[calc(100dvh-10rem)] [&_.cw-editor-input]:min-h-[calc(100dvh-14rem)]">
                  <PageContentEditor
                    blocks={page.blocks}
                    editorKey={`resource-edit-${page.item.id}-${edit.editorEpoch}`}
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

        {page.item.type === "file" ? (
          <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">
            This name is what people see in Resources. The file itself keeps its original
            filename.
          </p>
        ) : null}

        {page.item.type === "link" ? (
          <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">
            People open this web address from Resources. Save when the name or address is
            ready.
          </p>
        ) : null}
      </form>

      <ResourceDescriptionDialog
        open={descriptionOpen}
        value={edit.description}
        onClose={() => setDescriptionOpen(false)}
        onSave={edit.setDescription}
      />

      <MaterialVersionHistoryDialog
        open={historyOpen}
        versions={page.versions}
        restoring={page.revert.isPending}
        previewFromSnapshot={previewFromResourceSnapshot}
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
