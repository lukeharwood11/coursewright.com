import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import {
  fileQueryKeys,
  listFileVersions,
  replaceFile,
  revertFileToVersion,
} from "@/materials/databridge/files";
import { AudioSnippetRecorder } from "./AudioSnippetRecorder";

export function MaterialEditFileSection({
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
  const [restoreVersion, setRestoreVersion] = useState<
    Awaited<ReturnType<typeof listFileVersions>>[number] | null
  >(null);
  const [restoringFile, setRestoringFile] = useState(false);

  async function applyReplacement(next: File | null) {
    setRecorded(next);
    if (!next) return;
    await replaceFile({ fileId, organizationId, file: next });
    onChange();
  }

  return (
    <section className="max-w-xl">
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
        Audio: MP3 or M4A works best on phones. You can also record a clip below.
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
              onClick={() => setRestoreVersion(version)}
            >
              Restore
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={restoreVersion != null}
        title="Restore this file version?"
        body="The file students see will switch to this older copy. You can replace or restore again afterward."
        confirmLabel={restoringFile ? "Restoring…" : "Restore"}
        cancelLabel="Keep current file"
        onCancel={() => setRestoreVersion(null)}
        onConfirm={async () => {
          if (restoreVersion == null) return;
          const version = restoreVersion;
          setRestoreVersion(null);
          setRestoringFile(true);
          try {
            await revertFileToVersion({
              fileId,
              storageRef: version.storageRef,
              filename: version.filename,
              mimeType: version.mimeType,
              sizeBytes: version.sizeBytes,
            });
            onChange();
          } finally {
            setRestoringFile(false);
          }
        }}
      />
    </section>
  );
}
