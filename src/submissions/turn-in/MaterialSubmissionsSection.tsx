import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { formatPoints } from "@/quizzes/model/quiz";
import { Button } from "@/ui/Button";
import type { MaterialRecord } from "@/materials/databridge/materials";
import {
  acceptAttribute,
  parseSubmissionFileTypes,
  submissionFileTypeLabel,
  type SubmissionFileType,
} from "@/submissions/model/fileTypes";
import {
  attributionLine,
  pastDueBlocksTurnIn,
  submissionSlotOpen,
  turnInBatchError,
} from "@/submissions/model/submission";
import {
  browserTimeZone,
  DEFAULT_DUE_TIME,
  dueInstantIso,
  formatSubmittedAt,
  formatTimeRemaining,
  submissionClosesAtDue,
} from "@/submissions/model/dueInstant";
import type {
  MaterialSubmissionRecord,
  SubmissionFileRecord,
} from "@/submissions/databridge/submissions";
import {
  submissionPreviewKind,
  type SubmissionPreviewKind,
} from "@/submissions/model/preview";
import { useMaterialSubmissions } from "./hooks/useMaterialSubmissions";
import { SubmissionFileList } from "./components/SubmissionFileList";
import { SubmissionFilePreview } from "./components/SubmissionFilePreview";

type PreviewState = {
  file: SubmissionFileRecord;
  kind: SubmissionPreviewKind;
  url: string | null;
  text: string | null;
  loading: boolean;
  error: string | null;
};

function materialDueInstant(material: MaterialRecord): string | null {
  if (material.dueAt) return material.dueAt;
  if (!material.dueDate) return null;
  try {
    return dueInstantIso(
      material.dueDate,
      DEFAULT_DUE_TIME,
      material.dueTimezone || browserTimeZone(),
    );
  } catch {
    return null;
  }
}

function submitDeadlineLabel(dueAt: string, now: Date, closesAtDue: boolean): string | null {
  const left = formatTimeRemaining(dueAt, now);
  if (!left) return null;
  if (!closesAtDue) return left;
  return `Closes in ${left.replace(/ left$/, "")}`;
}

export function MaterialSubmissionsSection({
  material,
  courseId,
  mode,
}: {
  material: MaterialRecord;
  courseId: number;
  mode: "family" | "staff";
}) {
  const page = useMaterialSubmissions({
    materialId: material.id,
    courseId,
    enabled: true,
  });
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const allowed = parseSubmissionFileTypes(material.submissionFileTypes);
  const hasAny = page.submissions.some((row) => row.versions.length > 0);
  const show = material.acceptSubmissions || hasAny || Boolean(page.error);

  async function openPreview(file: SubmissionFileRecord) {
    const kind = submissionPreviewKind(file.mimeType, file.filename);
    if (!kind) return;
    setPreview({
      file,
      kind,
      url: null,
      text: null,
      loading: true,
      error: null,
    });
    try {
      const url = await page.signedUrl(file.storageRef);
      if (kind === "text") {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Couldn’t load that file.");
        const text = await response.text();
        setPreview({
          file,
          kind,
          url,
          text,
          loading: false,
          error: null,
        });
        return;
      }
      setPreview({
        file,
        kind,
        url,
        text: null,
        loading: false,
        error: null,
      });
    } catch (caught) {
      setPreview({
        file,
        kind,
        url: null,
        text: null,
        loading: false,
        error: caught instanceof Error ? caught.message : "Couldn’t open that file.",
      });
    }
  }

  function downloadFile(file: SubmissionFileRecord) {
    void page.downloadFile(file.storageRef, file.filename);
  }

  if (!show) return null;
  if (
    !page.loading &&
    !page.error &&
    mode === "family" &&
    page.students.length === 0 &&
    !hasAny
  ) {
    return null;
  }

  return (
    <>
      <aside
        data-submission-panel
        className="w-full rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 xl:sticky xl:top-4 xl:w-[20rem] xl:shrink-0"
      >
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
          {mode === "staff" ? "Submissions" : "Submit"}
        </h2>
        {allowed.length > 0 && material.acceptSubmissions ? (
          <AllowedFilesList allowed={allowed} />
        ) : null}
        {page.loading ? (
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading submissions…</p>
        ) : null}
        {page.error && !page.turningIn ? (
          <p className="mt-3 text-[14px] text-[var(--amber-deep)]" role="alert">
            {page.error instanceof Error ? page.error.message : "Something went wrong."}
          </p>
        ) : null}
        {!page.loading && mode === "staff" ? (
          <StaffSubmissionList
            students={page.students}
            submissions={page.submissions}
            onOpen={openPreview}
            onDownload={downloadFile}
          />
        ) : null}
        {!page.loading && mode === "family" ? (
          <FamilyTurnIn
            material={material}
            allowed={allowed}
            students={page.students}
            submissions={page.submissions}
            turningIn={page.turningIn}
            onTurnIn={page.turnIn}
            onOpen={openPreview}
            onDownload={downloadFile}
          />
        ) : null}
      </aside>
      {preview ? (
        <SubmissionFilePreview
          open
          title={preview.file.filename}
          kind={preview.kind}
          url={preview.url}
          text={preview.text}
          loading={preview.loading}
          error={preview.error}
          onClose={() => setPreview(null)}
          onDownload={() => downloadFile(preview.file)}
        />
      ) : null}
    </>
  );
}

function AllowedFilesList({ allowed }: { allowed: readonly SubmissionFileType[] }) {
  return (
    <div className="mt-3">
      <p className="text-[12px] font-bold text-[var(--ink-faint)]">Allowed files</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {allowed.map((kind) => (
          <li
            key={kind}
            className="rounded-[6px] bg-[var(--paper)] px-2 py-0.5 text-[12.5px] font-medium text-[var(--ink-soft)]"
          >
            {submissionFileTypeLabel(kind)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StaffSubmissionList({
  students,
  submissions,
  onOpen,
  onDownload,
}: {
  students: { id: number; name: string }[];
  submissions: MaterialSubmissionRecord[];
  onOpen: (file: SubmissionFileRecord) => void;
  onDownload: (file: SubmissionFileRecord) => void;
}) {
  const rows = useMemo(() => mergeRoster(students, submissions), [students, submissions]);
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[14.5px] text-[var(--ink-soft)]">
        No one has submitted yet.
      </p>
    );
  }
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.studentId} className="border-t border-[var(--line-soft)] pt-3 first:border-t-0 first:pt-0">
          <p className="text-[15px] font-bold text-[var(--ink)]">{row.studentName}</p>
          {row.versions.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">Not submitted</p>
          ) : (
            row.versions.map((version) => (
              <div key={version.id} className="mt-3">
                <p className="text-[14px] text-[var(--ink)]">
                  {attributionLine(version.parentName, row.studentName)}
                </p>
                <p className="text-[12.5px] text-[var(--ink-soft)]">
                  {formatSubmittedAt(version.submittedAt)}
                </p>
                <SubmissionFileList
                  files={version.files}
                  onOpen={onOpen}
                  onDownload={onDownload}
                />
              </div>
            ))
          )}
        </li>
      ))}
    </ul>
  );
}

type FamilyChoice = { id: number; name: string; canTurnIn: boolean };

function familyChoices(
  students: { id: number; name: string }[],
  submissions: MaterialSubmissionRecord[],
): FamilyChoice[] {
  const active = students.map((student) => ({
    id: student.id,
    name: student.name,
    canTurnIn: true,
  }));
  const seen = new Set(active.map((student) => student.id));
  const earlier = submissions.flatMap((row) => {
    if (seen.has(row.studentProfileId) || row.versions.length === 0) return [];
    return [
      {
        id: row.studentProfileId,
        name: row.studentName,
        canTurnIn: false,
      },
    ];
  });
  return [...active, ...earlier];
}

function mergeRoster(
  students: { id: number; name: string }[],
  submissions: MaterialSubmissionRecord[],
) {
  const byStudent = new Map(submissions.map((row) => [row.studentProfileId, row]));
  const seen = new Set<number>();
  const rows = students
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => {
      seen.add(student.id);
      const submission = byStudent.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        versions: submission?.versions ?? [],
      };
    });
  for (const submission of submissions) {
    if (seen.has(submission.studentProfileId) || submission.versions.length === 0) continue;
    rows.push({
      studentId: submission.studentProfileId,
      studentName: submission.studentName,
      versions: submission.versions,
    });
  }
  return rows;
}

function FamilyTurnIn({
  material,
  allowed,
  students,
  submissions,
  turningIn,
  onTurnIn,
  onOpen,
  onDownload,
}: {
  material: MaterialRecord;
  allowed: ReturnType<typeof parseSubmissionFileTypes>;
  students: { id: number; name: string }[];
  submissions: MaterialSubmissionRecord[];
  turningIn: boolean;
  onTurnIn: (input: {
    studentProfileId: number;
    files: File[];
    allowed: typeof allowed;
  }) => Promise<unknown>;
  onOpen: (file: SubmissionFileRecord) => void;
  onDownload: (file: SubmissionFileRecord) => void;
}) {
  const choices = familyChoices(students, submissions);
  const [studentId, setStudentId] = useState<number | null>(choices[0]?.id ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chosen =
    choices.find((row) => row.id === studentId) ?? choices[0] ?? null;
  const student = chosen;
  const submission = submissions.find((row) => row.studentProfileId === chosen?.id);
  const versions = submission?.versions ?? [];
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const dueAt = materialDueInstant(material);

  const closesAtDue = submissionClosesAtDue({
    allowPastDue: material.allowSubmissionsPastDue,
    dueAt,
  });

  useEffect(() => {
    if (!dueAt) return;
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [dueAt]);

  const pastDue = pastDueBlocksTurnIn({
    allowPastDue: material.allowSubmissionsPastDue,
    dueAt,
    now,
  });
  const remainingLabel = dueAt ? submitDeadlineLabel(dueAt, now, closesAtDue) : null;
  const canSubmitForm =
    material.visibility === "published" &&
    material.acceptSubmissions &&
    student != null &&
    student.canTurnIn &&
    submissionSlotOpen(versions.length, material.submissionLimit);
  const open = canSubmitForm && !pastDue;

  async function submit() {
    if (!student) return;
    const batchError = turnInBatchError(
      files.map((file) => ({ name: file.name, type: file.type })),
      allowed,
    );
    if (batchError) {
      setError(batchError);
      return;
    }
    setError(null);
    try {
      await onTurnIn({ studentProfileId: student.id, files, allowed });
      setFiles([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That file didn’t upload.");
    }
  }

  return (
    <div className="mt-3">
      {choices.length > 1 ? (
        <label className="mb-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Student</span>
          <select
            className="w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)]"
            value={chosen?.id ?? ""}
            onChange={(event) => {
              setStudentId(Number(event.target.value));
              setFiles([]);
              setError(null);
            }}
          >
            {choices.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {submission?.gradedAt ? (
        <div className="mb-4 rounded-[8px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2">
          <p className="text-[13px] font-bold text-[var(--ink)]">
            {material.gradable &&
            submission.pointsEarned != null &&
            submission.pointsPossible != null
              ? `Grade ${formatPoints(submission.pointsEarned)}/${formatPoints(submission.pointsPossible)}`
              : "Feedback"}
          </p>
          {submission.feedback.trim() ? (
            <p className="mt-1 whitespace-pre-wrap text-[14px] text-[var(--ink-soft)]">
              {submission.feedback}
            </p>
          ) : null}
        </div>
      ) : null}

      {versions.map((version) => (
        <div key={version.id} className="mb-4">
          <p className="text-[14px] text-[var(--ink)]">
            {attributionLine(version.parentName, student?.name ?? submission?.studentName ?? "")}
          </p>
          <p className="text-[12.5px] text-[var(--ink-soft)]">
            {formatSubmittedAt(version.submittedAt)}
          </p>
          <SubmissionFileList
            files={version.files}
            onOpen={onOpen}
            onDownload={onDownload}
          />
        </div>
      ))}

      {pastDue && material.acceptSubmissions && closesAtDue ? (
        <p className="text-[14px] text-[var(--ink-soft)]">
          Submission closed — the due date has passed.
        </p>
      ) : null}

      {open ? (
        <div className="mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              {versions.length === 0 ? "Files" : "Another version"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptAttribute(allowed)}
              className="sr-only"
              onChange={(event) => {
                const picked = [...(event.target.files ?? [])];
                setFiles((current) => [...current, ...picked]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose files
            </Button>
          </div>
          {files.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[14px] text-[var(--ink)]">{file.name}</span>
                  <button
                    type="button"
                    className="text-[13px] font-bold text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {error ? (
            <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-3">
            <Button
              fullWidth
              disabled={turningIn || files.length === 0}
              onClick={() => void submit()}
            >
              <ArrowUpTrayIcon className="h-5 w-5" aria-hidden />
              {turningIn
                ? "Submitting…"
                : versions.length === 0
                  ? "Submit"
                  : "Submit another version"}
            </Button>
            {remainingLabel ? (
              <p className="mt-2 text-center text-[12.5px] font-medium text-[var(--ink-soft)]">
                {remainingLabel}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
