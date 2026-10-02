import { useEffect, useState } from "react";
import { periodFeedbackBody } from "@/grading/model/periodFeedback";
import { Button } from "@/ui/Button";
import type { usePeriodFeedback } from "../hooks/usePeriodFeedback";

const fieldClass =
  "mt-2 w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none";

export function PeriodFeedbackForm({
  editor,
}: {
  editor: ReturnType<typeof usePeriodFeedback>;
}) {
  if (editor.missingCycle) {
    return (
      <p className="mt-4 max-w-xl text-[14.5px] text-[var(--ink-soft)]">
        Open period feedback from a fill cycle. Comments belong to that marking period.
      </p>
    );
  }

  if (editor.students.length === 0) {
    return (
      <p className="mt-4 text-[14.5px] text-[var(--ink-soft)]">
        Enroll students before writing comments.
      </p>
    );
  }

  return (
    <div className="mt-4 max-w-2xl space-y-4">
      {editor.cycleLabel ? (
        <p className="text-[14px] text-[var(--ink-soft)]">{editor.cycleLabel}</p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {editor.students.map((student) => (
          <StudentComment key={student.id} editor={editor} student={student} />
        ))}
      </ul>
      {editor.canEdit ? (
        <div>
          <Button type="button" disabled={editor.submitting} onClick={editor.submitPackage}>
            {editor.submitting ? "Submitting…" : "Submit period feedback"}
          </Button>
          <p className="mt-2 text-[13px] text-[var(--ink-soft)]">
            Blank comments are allowed. Submitting lets families read the comments that are saved.
            You can still edit until the cycle is closed.
          </p>
        </div>
      ) : editor.closed ? (
        <p className="text-[14px] text-[var(--ink-soft)]">This fill cycle is closed.</p>
      ) : null}
    </div>
  );
}

function StudentComment({
  editor,
  student,
}: {
  editor: ReturnType<typeof usePeriodFeedback>;
  student: { id: number; name: string };
}) {
  const saved = editor.feedback.find((row) => row.studentId === student.id)?.body ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? saved;

  useEffect(() => {
    if (draft == null) return;
    const next = periodFeedbackBody(draft) ?? "";
    if (next === saved) setDraft(null);
  }, [draft, saved]);

  return (
    <li className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <label className="block">
        <span className="text-[14px] font-extrabold text-[var(--ink)]">{student.name}</span>
        <textarea
          className={fieldClass}
          rows={4}
          value={value}
          readOnly={!editor.canEdit}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (!editor.canEdit || draft == null || draft === saved) return;
            editor.saveStudent(student.id, draft);
          }}
        />
      </label>
    </li>
  );
}
