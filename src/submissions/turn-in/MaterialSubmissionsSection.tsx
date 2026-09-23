import { useMemo, useState } from "react";
import { Button } from "@/ui/Button";
import type { MaterialRecord } from "@/materials/databridge/materials";
import {
  acceptAttribute,
  parseSubmissionFileTypes,
} from "@/submissions/model/fileTypes";
import {
  attributionLine,
  pastDueBlocksTurnIn,
  submissionSlotOpen,
  turnInBatchError,
} from "@/submissions/model/submission";
import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import type { MaterialSubmissionRecord } from "@/submissions/databridge/submissions";
import { useMaterialSubmissions } from "./hooks/useMaterialSubmissions";
import { SubmissionFileList } from "./components/SubmissionFileList";

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
  const allowed = parseSubmissionFileTypes(material.submissionFileTypes);
  const hasAny = page.submissions.some((row) => row.versions.length > 0);
  const show = material.acceptSubmissions || hasAny || Boolean(page.error);

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
    <section className="mt-8 max-w-2xl">
      <h2
        className="text-[20px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {mode === "staff" ? "Submissions" : "Turn in"}
      </h2>
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
          onOpen={(file, download) => {
            void page.openFile(file.storageRef, file.filename, download);
          }}
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
          onOpen={(file, download) => {
            void page.openFile(file.storageRef, file.filename, download);
          }}
        />
      ) : null}
    </section>
  );
}

function StaffSubmissionList({
  students,
  submissions,
  onOpen,
}: {
  students: { id: number; name: string }[];
  submissions: MaterialSubmissionRecord[];
  onOpen: (file: MaterialSubmissionRecord["versions"][number]["files"][number], download: boolean) => void;
}) {
  const rows = useMemo(() => mergeRoster(students, submissions), [students, submissions]);
  if (rows.length === 0) {
    return (
      <p className="mt-3 text-[14.5px] text-[var(--ink-soft)]">
        No one has turned this in yet.
      </p>
    );
  }
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {rows.map((row) => (
        <li
          key={row.studentId}
          className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
        >
          <p className="text-[16px] font-bold text-[var(--ink)]">{row.studentName}</p>
          {row.versions.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">Not turned in</p>
          ) : (
            row.versions.map((version) => (
              <div key={version.id} className="mt-3">
                <p className="text-[14.5px] text-[var(--ink)]">
                  {attributionLine(version.parentName, row.studentName)}
                </p>
                <p className="text-[13px] text-[var(--ink-soft)]">
                  {formatSubmittedAt(version.submittedAt)}
                </p>
                <SubmissionFileList files={version.files} onOpen={onOpen} />
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
  onOpen: (file: MaterialSubmissionRecord["versions"][number]["files"][number], download: boolean) => void;
}) {
  const choices = familyChoices(students, submissions);
  const [studentId, setStudentId] = useState<number | null>(choices[0]?.id ?? null);
  const chosen =
    choices.find((row) => row.id === studentId) ?? choices[0] ?? null;
  const student = chosen;
  const submission = submissions.find((row) => row.studentProfileId === chosen?.id);
  const versions = submission?.versions ?? [];
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pastDue = pastDueBlocksTurnIn({
    allowPastDue: material.allowSubmissionsPastDue,
    dueAt: material.dueAt,
    now: new Date(),
  });
  const open =
    material.visibility === "published" &&
    material.acceptSubmissions &&
    student != null &&
    student.canTurnIn &&
    submissionSlotOpen(versions.length, material.submissionLimit) &&
    !pastDue;

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

      {versions.map((version) => (
        <div key={version.id} className="mb-4">
          <p className="text-[14.5px] text-[var(--ink)]">
            {attributionLine(version.parentName, student?.name ?? submission?.studentName ?? "")}
          </p>
          <p className="text-[13px] text-[var(--ink-soft)]">
            {formatSubmittedAt(version.submittedAt)}
          </p>
          <SubmissionFileList files={version.files} onOpen={onOpen} />
        </div>
      ))}

      {pastDue && material.acceptSubmissions ? (
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          The due date has passed, so this can no longer be turned in.
        </p>
      ) : null}

      {open ? (
        <div className="mt-2">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              {versions.length === 0 ? "Files" : "Another version"}
            </span>
            <input
              type="file"
              multiple
              accept={acceptAttribute(allowed)}
              className="text-[13.5px] text-[var(--ink-soft)]"
              onChange={(event) => {
                const picked = [...(event.target.files ?? [])];
                setFiles((current) => [...current, ...picked]);
                event.target.value = "";
              }}
            />
          </label>
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
            <Button disabled={turningIn || files.length === 0} onClick={() => void submit()}>
              {turningIn
                ? "Turning in…"
                : versions.length === 0
                  ? "Turn in"
                  : "Turn in another version"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
