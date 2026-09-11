import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useMutation } from "@tanstack/react-query";
import type { Json } from "@/infrastructure/supabase/database.types";
import {
  createBlock,
  softDeleteBlock,
  updateBlock,
} from "@/materials/databridge/blocks";
import { replaceFile, revertFileToVersion, listFileVersions } from "@/materials/databridge/files";
import { updateMaterial } from "@/materials/databridge/materials";
import {
  parseRichTextBody,
  parseVideoBody,
  richTextBody,
  videoBody,
} from "@/materials/model/blocks";
import { materialPath } from "@/materials/model/paths";
import { useQuery } from "@tanstack/react-query";
import { useMaterial } from "./hooks/useMaterial";
import { VisibilityBanner } from "./components/VisibilityBanner";
import { fileQueryKeys } from "@/materials/databridge/files";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function MaterialEditPage() {
  const page = useMaterial();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    if (!page.material) return;
    setTitle(page.material.title);
    setDescription(page.material.description);
    setUrl(page.material.url ?? "");
    setScheduledDate(page.material.scheduledDate ?? "");
  }, [page.material]);

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

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading editor…</p>
      </div>
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

      {!page.material.deletedAt ? (
        <VisibilityBanner
          visibility={page.material.visibility}
          canEdit={page.canEdit}
          pending={page.setVisibility.isPending}
          onPublish={() => page.setVisibility.mutate("published")}
          onUnpublish={() => page.setVisibility.mutate("unpublished")}
        />
      ) : null}

      <PlacementForm
        title={title}
        description={description}
        url={url}
        scheduledDate={scheduledDate}
        kind={page.material.kind}
        saving={false}
        onTitle={setTitle}
        onDescription={setDescription}
        onUrl={setUrl}
        onScheduledDate={setScheduledDate}
        onSave={() =>
          updateMaterial(page.material!.id, {
            title: title.trim() || page.material!.title,
            description,
            url: page.material!.kind === "link" ? url.trim() : page.material!.url,
            scheduledDate: scheduledDate || null,
          }).then(() => page.invalidate())
        }
      />

      {page.material.kind === "page" ? (
        <PageBlocksEditor
          materialId={page.material.id}
          blocks={page.blocks}
          onChange={page.invalidate}
        />
      ) : null}

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
                  page.revert.mutate(version.snapshot);
                }}
              >
                Restore
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PlacementForm({
  title,
  description,
  url,
  scheduledDate,
  kind,
  onTitle,
  onDescription,
  onUrl,
  onScheduledDate,
  onSave,
}: {
  title: string;
  description: string;
  url: string;
  scheduledDate: string;
  kind: string;
  saving: boolean;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onUrl: (value: string) => void;
  onScheduledDate: (value: string) => void;
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await onSave();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Couldn’t save.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input className="w-full" value={title} onChange={(event) => onTitle(event.target.value)} />
      </label>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Description</span>
        <textarea
          className={`${controlClass} min-h-[4.5rem] resize-y`}
          value={description}
          onChange={(event) => onDescription(event.target.value)}
        />
      </label>
      {kind === "link" ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Web address</span>
          <Input className="w-full" value={url} onChange={(event) => onUrl(event.target.value)} />
        </label>
      ) : null}
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Date for this week (optional)
        </span>
        <Input
          className="w-full"
          type="date"
          value={scheduledDate}
          onChange={(event) => onScheduledDate(event.target.value)}
        />
      </label>
      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]">{error}</p>
      ) : null}
      <div className="mt-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function PageBlocksEditor({
  materialId,
  blocks,
  onChange,
}: {
  materialId: number;
  blocks: Array<{ id: number; kind: "rich_text" | "video"; body: unknown }>;
  onChange: () => void;
}) {
  const add = useMutation({
    mutationFn: (kind: "rich_text" | "video") =>
      createBlock({
        materialId,
        kind,
        body: kind === "rich_text" ? richTextBody("") : videoBody(""),
      }),
    onSuccess: onChange,
  });

  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Blocks</h2>
      <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
        Rich text is stored as Markdown in the block until a canonical format is
        locked. Video blocks use a URL (YouTube or a link).
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {blocks.map((block) => (
          <BlockEditor
            key={block.id}
            id={block.id}
            kind={block.kind}
            body={block.body}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => add.mutate("rich_text")}
          disabled={add.isPending}
        >
          Add text
        </Button>
        <Button
          variant="secondary"
          onClick={() => add.mutate("video")}
          disabled={add.isPending}
        >
          Add video
        </Button>
      </div>
    </section>
  );
}

function BlockEditor({
  id,
  kind,
  body,
  onChange,
}: {
  id: number;
  kind: "rich_text" | "video";
  body: unknown;
  onChange: () => void;
}) {
  const [value, setValue] = useState(
    kind === "video" ? parseVideoBody(body) : parseRichTextBody(body),
  );

  useEffect(() => {
    setValue(kind === "video" ? parseVideoBody(body) : parseRichTextBody(body));
  }, [body, kind]);

  return (
    <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <p className="text-[12px] font-bold text-[var(--ink-faint)]">
        {kind === "video" ? "Video URL" : "Rich text"}
      </p>
      {kind === "video" ? (
        <Input
          className="mt-2 w-full"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://youtu.be/…"
        />
      ) : (
        <textarea
          className={`${controlClass} mt-2 min-h-[8rem] resize-y`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={async () => {
            const next: Json =
              kind === "video" ? videoBody(value.trim()) : richTextBody(value);
            await updateBlock(id, { body: next });
            onChange();
          }}
        >
          Save block
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            if (!window.confirm("Remove this block?")) return;
            await softDeleteBlock(id);
            onChange();
          }}
        >
          Remove
        </Button>
      </div>
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
            await replaceFile({ fileId, organizationId, file: next });
            onChange();
          }}
        />
      </label>
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
