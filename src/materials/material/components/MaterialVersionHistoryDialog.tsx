import { lazy, Suspense, useEffect, useId, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PageLoading } from "@/ui/PageLoading";
import type { MaterialVersionRecord } from "@/materials/databridge/materials";
import { materialForDateLabel } from "@/materials/model/materialForDateLabel";
import {
  materialChangeTypeLabel,
  previewFromMaterialSnapshot,
  type MaterialVersionPreview,
} from "@/materials/model/versionSnapshot";
import { DEFAULT_HOME_DAYS, type HomeDay } from "@/organizations/model/homeDays";
import {
  DEFAULT_SCHOOL_DAYS,
  type SchoolDay,
} from "@/organizations/model/schoolDays";

export type VersionHistoryRecord = MaterialVersionRecord;

function versionListMeta(version: VersionHistoryRecord): string {
  const parts = [
    materialChangeTypeLabel(version.changeType),
    version.changedByName,
    new Date(version.changedAt).toLocaleString(),
  ].filter(Boolean);
  return parts.join(" · ");
}

const PageContentView = lazy(async () => {
  const module = await import("./PageContentView");
  return { default: module.PageContentView };
});

export function MaterialVersionHistoryDialog({
  open,
  versions,
  restoring,
  onClose,
  onRestore,
  previewFromSnapshot = previewFromMaterialSnapshot,
  schoolDays = DEFAULT_SCHOOL_DAYS,
  homeDays = DEFAULT_HOME_DAYS,
}: {
  open: boolean;
  versions: VersionHistoryRecord[];
  restoring: boolean;
  onClose: () => void;
  onRestore: (snapshot: unknown) => void;
  previewFromSnapshot?: (snapshot: unknown) => MaterialVersionPreview | null;
  schoolDays?: readonly SchoolDay[];
  homeDays?: readonly HomeDay[];
}) {
  const titleId = useId();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedVersion(versions[0]?.version ?? null);
    setConfirmRestore(false);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, versions]);

  if (!open) return null;

  const selected =
    versions.find((version) => version.version === selectedVersion) ??
    versions[0] ??
    null;
  const selectedIndex = selected
    ? versions.findIndex((version) => version.version === selected.version)
    : -1;
  const preview = selected ? previewFromSnapshot(selected.snapshot) : null;
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex >= 0 && selectedIndex < versions.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 md:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-[var(--ink)]/30"
          aria-label="Dismiss"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative flex h-[min(90dvh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] shadow-[var(--shadow)]"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line-soft)] px-4 py-3 md:px-5">
            <h2
              id={titleId}
              className="text-[15.5px] font-extrabold text-[var(--ink)]"
            >
              Version history
            </h2>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-[6px] p-1.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              aria-label="Close"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" aria-hidden />
            </button>
          </header>

          {versions.length === 0 ? (
            <p className="px-5 py-8 text-[14.5px] text-[var(--ink-soft)]">
              No versions yet.
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <aside className="shrink-0 border-b border-[var(--line-soft)] md:w-64 md:border-b-0 md:border-r md:border-[var(--line-soft)]">
                <ul className="flex max-h-40 gap-1 overflow-x-auto p-2 md:max-h-none md:flex-col md:overflow-y-auto md:p-2">
                  {versions.map((version) => {
                    const active = version.version === selected?.version;
                    return (
                      <li key={version.version} className="shrink-0 md:shrink md:w-full">
                        <button
                          type="button"
                          className={[
                            "w-full rounded-[6px] px-3 py-2 text-left transition-colors",
                            active
                              ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
                              : "text-[var(--ink)] hover:bg-[var(--paper)]",
                          ].join(" ")}
                          onClick={() => setSelectedVersion(version.version)}
                        >
                          <span className="block text-[13px] font-bold">
                            Version {version.version}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[var(--ink-soft)]">
                            {versionListMeta(version)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--line-soft)] px-4 py-2 md:px-5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-[6px] p-1.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)] disabled:opacity-40"
                      aria-label="Newer version"
                      disabled={!canPrev}
                      onClick={() => {
                        if (!canPrev) return;
                        setSelectedVersion(versions[selectedIndex - 1]!.version);
                      }}
                    >
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-[6px] p-1.5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)] disabled:opacity-40"
                      aria-label="Older version"
                      disabled={!canNext}
                      onClick={() => {
                        if (!canNext) return;
                        setSelectedVersion(versions[selectedIndex + 1]!.version);
                      }}
                    >
                      <ChevronRightIcon className="h-5 w-5" aria-hidden />
                    </button>
                    {selected ? (
                      <span className="ml-1 text-[13px] text-[var(--ink-soft)]">
                        Version {selected.version} of {versions.length}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!selected || restoring}
                    onClick={() => setConfirmRestore(true)}
                  >
                    Restore this version
                  </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
                  {!preview ? (
                    <p className="text-[14.5px] text-[var(--ink-soft)]">
                      We couldn’t preview that version.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3
                          className="text-[20px] font-semibold text-[var(--ink)]"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {preview.title}
                        </h3>
                        {preview.description ? (
                          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
                            {preview.description}
                          </p>
                        ) : null}
                        {(preview.scheduledDate || preview.dueDate) && (
                          <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
                            {[
                              preview.scheduledDate
                                ? `${materialForDateLabel(
                                    preview.scheduledDate,
                                    schoolDays,
                                    homeDays,
                                  )} ${preview.scheduledDate}`
                                : null,
                              preview.dueDate ? `Due ${preview.dueDate}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      {preview.kind === "page" ? (
                        <Suspense
                          fallback={<PageLoading embedded label="Loading preview…" />}
                        >
                          <PageContentView
                            blocks={preview.blocks}
                            viewKey={`version-preview-${selected?.version ?? 0}`}
                            showAnswers
                          />
                        </Suspense>
                      ) : null}

                      {preview.kind === "link" ? (
                        preview.url ? (
                          <p>
                            <a
                              href={preview.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                            >
                              {preview.url}
                            </a>
                          </p>
                        ) : (
                          <p className="text-[14px] text-[var(--ink-soft)]">
                            No web address in this version.
                          </p>
                        )
                      ) : null}

                      {preview.kind === "file" ? (
                        <p className="text-[14px] text-[var(--ink-soft)]">
                          {preview.fileId
                            ? "This version points at a file attachment. Restoring brings that file back with the rest of the material."
                            : "No file was attached in this version."}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmRestore && selected != null}
        title="Restore this version?"
        body="Your current edits will be replaced with this older version. You can save again or pick another version afterward."
        confirmLabel={restoring ? "Restoring…" : "Restore"}
        cancelLabel="Keep current"
        onCancel={() => setConfirmRestore(false)}
        onConfirm={() => {
          if (!selected) return;
          setConfirmRestore(false);
          onRestore(selected.snapshot);
        }}
      />
    </>
  );
}
