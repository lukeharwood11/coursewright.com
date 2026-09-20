import { useEffect, lazy, Suspense, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { Input } from "@/ui/Input";
import { PageFormActions } from "@/ui/PageFormActions";
import { useQuery } from "@tanstack/react-query";
import { replaceFile, revertFileToVersion, listFileVersions } from "@/materials/databridge/files";
import { materialPath } from "@/materials/model/paths";
import { useMaterialEdit } from "./hooks/useMaterialEdit";
import {
  UnpublishControl,
  VisibilityBanner,
} from "./components/VisibilityBanner";
import { OptionalDueDateField } from "./components/OptionalDueDateField";
import { AudioSnippetRecorder } from "./components/AudioSnippetRecorder";
import { PageEditorMediaProvider } from "./components/PageEditorMediaContext";
import { fileQueryKeys } from "@/materials/databridge/files";

const PageContentEditor = lazy(async () => {
  const module = await import("./components/PageContentEditor");
  return { default: module.PageContentEditor };
});

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function MaterialEditPage() {
  const edit = useMaterialEdit();
  const page = edit.page;

  useEffect(() => {
    document.title = page.material
      ? `Edit ${page.material.title} · Course Wright`
      : "Edit material · Course Wright";
  }, [page.material]);

  if (!page.canEdit && !page.loading && page.material && page.course) {
    return (
      <Navigate
        to={materialPath({
          orgSlug: page.organization.slug,
          courseId: page.course.id,
          unitId: page.material.unitId,
          materialId: page.material.id,
        })}
        replace
      />
    );
  }

  if (page.loading || (page.material?.kind === "page" && page.blocksLoading)) {
    return (
      <PageLoading label="Loading editor…" />
    );
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

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Edit {page.material.title}
          </h1>
          <p className="mt-2 text-[13px]">
            <Link
              to={viewHref}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to material
            </Link>
          </p>
        </div>
        <PageFormActions
          formId={edit.formId}
          saving={edit.saving}
          hasChanges={edit.hasChanges}
          cancelTo={viewHref}
        />
      </div>

      {!page.material.deletedAt ? (
        <VisibilityBanner
          visibility={page.material.visibility}
          canEdit={page.canEdit}
          pending={page.setVisibility.isPending}
          onPublish={() => page.setVisibility.mutate("published")}
        />
      ) : null}

      <form
        id={edit.formId}
        className="mt-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await edit.save();
        }}
      >
        <div className="max-w-xl min-w-0 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
            <Input
              className="w-full"
              value={edit.title}
              onChange={(event) => edit.setTitle(event.target.value)}
            />
          </label>
          <label className="mt-3 flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Description
            </span>
            <textarea
              className={`${controlClass} min-h-[4.5rem] resize-y`}
              value={edit.description}
              onChange={(event) => edit.setDescription(event.target.value)}
            />
          </label>
          {page.material.kind === "link" ? (
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                Web address
              </span>
              <Input
                className="w-full"
                value={edit.url}
                onChange={(event) => edit.setUrl(event.target.value)}
              />
            </label>
          ) : null}
          <label className="mt-3 flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Assignment date (optional)
            </span>
            <Input
              className="w-full"
              type="date"
              value={edit.scheduledDate}
              onChange={(event) => edit.setScheduledDate(event.target.value)}
            />
            <span className="text-[12px] text-[var(--ink-faint)]">
              If you set a date, this shows up on parents’ This week page that week.
            </span>
          </label>
          <OptionalDueDateField
            value={edit.dueDate}
            onChange={edit.setDueDate}
          />
        </div>

        {page.material.kind === "page" ? (
          <section className="mt-8 max-w-3xl">
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Content</h2>
            <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
              Write the lesson here — headings, lists, tables, links, videos,
              and files. Type / to insert a block. Save at the top when you’re
              ready — a new version is stored only if this page changed.
            </p>
            <div className="mt-3">
              <Suspense
                fallback={<PageLoading embedded label="Loading editor…" />}
              >
                <PageEditorMediaProvider
                  value={{
                    organizationId: page.organization.id,
                    userId: page.userId,
                  }}
                >
                  <PageContentEditor
                    blocks={page.blocks}
                    editorKey={`${page.material.id}-${edit.editorEpoch}`}
                    editable
                    onDraftChange={edit.onDraftChange}
                  />
                </PageEditorMediaProvider>
              </Suspense>
            </div>
          </section>
        ) : null}

        {edit.error ? (
          <p className="mt-3 text-[13px] text-[var(--amber-deep)]">{edit.error}</p>
        ) : null}
      </form>

      {page.material.kind === "file" && page.file ? (
        <FileEditor
          organizationId={page.organization.id}
          fileId={page.file.id}
          filename={page.file.filename}
          onChange={page.invalidate}
        />
      ) : null}

      <section className="mt-8">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Versions</h2>
        <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {page.versions.map((version) => (
            <li
              key={version.version}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <span className="text-[13.5px] text-[var(--ink)]">
                Version {version.version} · {version.changeType} ·{" "}
                {new Date(version.changedAt).toLocaleString()}
              </span>
              <Button
                variant="secondary"
                className="px-2.5 py-1.5 text-[12px]"
                onClick={() => {
                  if (!window.confirm("Restore this version?")) return;
                  page.revert.mutate(version.snapshot, {
                    onSuccess: edit.afterRestore,
                  });
                }}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {!page.material.deletedAt ? (
        <UnpublishControl
          visibility={page.material.visibility}
          canEdit={page.canEdit}
          pending={page.setVisibility.isPending}
          onUnpublish={() => page.setVisibility.mutate("unpublished")}
        />
      ) : null}
    </div>
  );
}

function FileEditor({
  organizationId,
  fileId,
  filename,
  onChange,
}: {
  organizationId: number;
  fileId: number;
  filename: string;
  onChange: () => void;
}) {
  const versionsQuery = useQuery({
    queryKey: fileQueryKeys.versions(fileId),
    queryFn: () => listFileVersions(fileId),
  });
  const [recorded, setRecorded] = useState<File | null>(null);

  async function applyReplacement(next: File | null) {
    setRecorded(next);
    if (!next) return;
    await replaceFile({ fileId, organizationId, file: next });
    onChange();
  }

  return (
    <section className="mt-8 max-w-xl">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">File</h2>
      <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">{filename}</p>
      <label className="mt-3 block text-[13px] font-bold text-[var(--ink-soft)]">
        Replace file
        <input
          type="file"
          className="mt-1 block text-[13.5px]"
          onChange={async (event) => {
            const next = event.target.files?.[0];
            if (!next) return;
            await applyReplacement(next);
          }}
        />
      </label>
      <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
        Audio: MP3 or M4A works best on phones. You can also record a clip
        below.
      </p>
      <div className="mt-3">
        <AudioSnippetRecorder file={recorded} onFile={applyReplacement} />
      </div>
      <ul className="mt-4 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
        {(versionsQuery.data ?? []).map((version) => (
          <li
            key={version.version}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
          >
            <span className="text-[13px] text-[var(--ink)]">
              v{version.version} · {version.filename} · {version.changeType}
            </span>
            <Button
              variant="secondary"
              className="px-2.5 py-1.5 text-[12px]"
              onClick={async () => {
                if (!window.confirm("Restore this file version?")) return;
                await revertFileToVersion({
                  fileId,
                  storageRef: version.storageRef,
                  filename: version.filename,
                  mimeType: version.mimeType,
                  sizeBytes: version.sizeBytes,
                });
                onChange();
              }}
            >
              Restore
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
