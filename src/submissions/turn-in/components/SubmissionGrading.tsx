import { useState } from "react";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { formatPoints } from "@/quizzes/model/quiz";
import { formatSubmittedAt } from "@/submissions/model/dueInstant";
import { submissionWaitingForGrade } from "@/submissions/model/grade";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { SubmissionFileRecord } from "@/submissions/databridge/submissions";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useSubmissionGrading } from "../hooks/useSubmissionGrading";
import { SubmissionFilePreview } from "./SubmissionFilePreview";
import { SubmissionGradeWalkthrough } from "./SubmissionGradeWalkthrough";
import { submissionPreviewKind, type SubmissionPreviewKind } from "@/submissions/model/preview";

type PreviewState = {
  file: SubmissionFileRecord;
  kind: SubmissionPreviewKind;
  url: string | null;
  text: string | null;
  loading: boolean;
  error: string | null;
};

export function SubmissionGrading({
  material,
  courseId,
}: {
  material: MaterialRecord;
  courseId: number;
}) {
  const page = useSubmissionGrading({
    materialId: material.id,
    courseId,
    enabled: material.acceptSubmissions,
  });
  const [openId, setOpenId] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  if (!material.acceptSubmissions) return null;

  const turnedIn = page.submissions.filter((row) => row.versions.length > 0);
  const waiting = turnedIn.filter(submissionWaitingForGrade);
  const graded = turnedIn.filter((row) => row.gradedAt != null);
  const open = turnedIn.find((row) => row.id === openId) ?? null;
  const nextWaiting = waiting.find((row) => row.id !== openId) ?? null;

  async function openFile(file: SubmissionFileRecord) {
    const kind = submissionPreviewKind(file.mimeType, file.filename);
    if (!kind) return;
    setPreview({ file, kind, url: null, text: null, loading: true, error: null });
    try {
      const url = await page.signedUrl(file.storageRef);
      if (kind === "text") {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Couldn’t load that file.");
        setPreview({ file, kind, url, text: await response.text(), loading: false, error: null });
        return;
      }
      setPreview({ file, kind, url, text: null, loading: false, error: null });
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

  if (open) {
    return (
      <>
        <SubmissionGradeWalkthrough
          key={open.id}
          submission={open}
          gradable={material.gradable}
          pointsPossible={material.pointsPossible}
          saving={page.saving}
          hasNext={nextWaiting != null}
          onBack={() => setOpenId(null)}
          onOpen={openFile}
          onDownload={downloadFile}
          onSave={(grade, thenNext) =>
            page.save(
              { submissionId: open.id, points: grade.points, feedback: grade.feedback },
              {
                onSuccess: () => setOpenId(thenNext ? (nextWaiting?.id ?? null) : null),
              },
            )
          }
        />
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

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Grading</h2>
          <p className="mt-1 text-[14px] text-[var(--ink)]">
            {waiting.length} waiting · {graded.length} saved
            {material.gradable && material.pointsPossible != null
              ? ` · ${formatPoints(material.pointsPossible)} possible`
              : " · Feedback only"}
          </p>
        </div>
        {waiting.length > 0 ? (
          <Button type="button" onClick={() => setOpenId(waiting[0]?.id ?? null)}>
            <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden />
            Grade next
          </Button>
        ) : null}
      </div>
      {page.loading ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Loading submissions…</p>
      ) : turnedIn.length === 0 ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">No submissions yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          <GradeGroup title="Waiting" rows={waiting} onOpen={setOpenId} gradable={material.gradable} />
          <GradeGroup title="Saved" rows={graded} onOpen={setOpenId} gradable={material.gradable} />
        </div>
      )}
    </section>
  );
}

function GradeGroup({
  title,
  rows,
  onOpen,
  gradable,
}: {
  title: string;
  rows: ReturnType<typeof useSubmissionGrading>["submissions"];
  onOpen: (id: number) => void;
  gradable: boolean;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-[14px] text-[var(--ink-faint)]">None.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {rows.map((row) => {
            const latest = row.versions[row.versions.length - 1];
            const score =
              gradable && row.pointsEarned != null && row.pointsPossible != null
                ? `${formatPoints(row.pointsEarned)}/${formatPoints(row.pointsPossible)}`
                : null;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 text-left hover:border-[var(--line)]"
                  onClick={() => onOpen(row.id)}
                >
                  <span>
                    <span className="block text-[14.5px] font-bold text-[var(--ink)]">
                      {row.studentName}
                    </span>
                    <span className="block text-[12.5px] text-[var(--ink-faint)]">
                      {latest ? formatSubmittedAt(latest.submittedAt) : ""}
                      {score ? ` · ${score}` : ""}
                    </span>
                  </span>
                  <Badge variant={row.gradedAt ? "green" : "amber"}>
                    {row.gradedAt ? (gradable ? "Graded" : "Feedback") : "Needs a grade"}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
