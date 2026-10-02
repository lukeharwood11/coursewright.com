import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { CourseOutcome, OutcomeCriterion } from "@/outcomes/model/outcomes";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Input } from "@/ui/Input";
import type { useCourseOutcomes } from "../hooks/useCourseOutcomes";

type Editor = ReturnType<typeof useCourseOutcomes>;

export function OutcomeEditor({ editor }: { editor: Editor }) {
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<OutcomeCriterion | null>(null);

  return (
    <div className="mt-6 flex flex-col gap-4">
      {editor.active.length === 0 ? (
        <p className="max-w-xl text-[14.5px] text-[var(--ink-soft)]">
          Add what students should be able to do by the end of this course. You
          can split an outcome into criteria when you want a separate rating
          for each part.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {editor.active.map((outcome, index) => (
            <li key={outcome.id}>
              <OutcomeCard
                outcome={outcome}
                index={index}
                count={editor.active.length}
                canEdit={editor.canEdit}
                editor={editor}
                onDeleteCriterion={setPendingDelete}
              />
            </li>
          ))}
        </ul>
      )}

      {editor.canEdit ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            editor.addOutcome(draft, () => setDraft(""));
          }}
        >
          <label className="flex min-w-[16rem] flex-1 flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              New outcome
            </span>
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Explain how cells produce energy"
            />
          </label>
          <Button type="submit" disabled={editor.saving || !draft.trim()}>
            <PlusIcon className="h-4 w-4" aria-hidden />
            Add outcome
          </Button>
        </form>
      ) : null}

      {editor.formError ? (
        <p className="text-[13px] font-bold text-[var(--amber-deep)]" role="alert">
          {editor.formError}
        </p>
      ) : null}

      {editor.archived.length > 0 ? (
        <section className="mt-2">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Archived</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {editor.archived.map((outcome) => (
              <li
                key={outcome.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[var(--line-soft)] px-3 py-2"
              >
                <span className="text-[14px] text-[var(--ink-soft)]">{outcome.statement}</span>
                {editor.canEdit ? (
                  <Button variant="secondary" onClick={() => editor.restore(outcome.id)}>
                    Restore
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingDelete != null}
        title="Remove this criterion?"
        body={
          pendingDelete
            ? `“${pendingDelete.statement}” will be removed from this outcome.`
            : ""
        }
        confirmLabel="Remove criterion"
        cancelLabel="Cancel"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) editor.removeCriterion(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

function OutcomeCard({
  outcome,
  index,
  count,
  canEdit,
  editor,
  onDeleteCriterion,
}: {
  outcome: CourseOutcome;
  index: number;
  count: number;
  canEdit: boolean;
  editor: Editor;
  onDeleteCriterion: (criterion: OutcomeCriterion) => void;
}) {
  const [criterionDraft, setCriterionDraft] = useState("");

  return (
    <article className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-start gap-2">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Outcome</span>
          <Input
            defaultValue={outcome.statement}
            key={`${outcome.id}-${outcome.statement}`}
            disabled={!canEdit}
            aria-label={`Outcome ${index + 1}`}
            onBlur={(event) => {
              const next = event.target.value;
              if (next.trim() && next.trim() !== outcome.statement) {
                editor.saveStatement(outcome.id, next);
              }
            }}
          />
        </label>
        {canEdit ? (
          <div className="flex items-center gap-1 pt-6">
            <Button
              variant="secondary"
              aria-label="Move outcome up"
              disabled={index === 0}
              onClick={() => editor.moveUp(outcome)}
            >
              <ChevronUpIcon className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              aria-label="Move outcome down"
              disabled={index === count - 1}
              onClick={() => editor.moveDown(outcome)}
            >
              <ChevronDownIcon className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="secondary" onClick={() => editor.archive(outcome.id)}>
              Archive
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">Criteria</h3>
        <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
          Optional. When you add criteria, teachers rate each one instead of the
          outcome as a whole.
        </p>
        {outcome.criteria.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {outcome.criteria.map((criterion, criterionIndex) => (
              <li key={criterion.id} className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-[12rem] flex-1"
                  defaultValue={criterion.statement}
                  key={`${criterion.id}-${criterion.statement}`}
                  disabled={!canEdit}
                  aria-label={`Criterion ${criterionIndex + 1}`}
                  onBlur={(event) => {
                    const next = event.target.value;
                    if (next.trim() && next.trim() !== criterion.statement) {
                      editor.saveCriterion(criterion.id, next);
                    }
                  }}
                />
                {canEdit ? (
                  <>
                    <Button
                      variant="secondary"
                      aria-label="Move criterion up"
                      disabled={criterionIndex === 0}
                      onClick={() => editor.moveCriterion(outcome, criterion.id, -1)}
                    >
                      <ChevronUpIcon className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="secondary"
                      aria-label="Move criterion down"
                      disabled={criterionIndex === outcome.criteria.length - 1}
                      onClick={() => editor.moveCriterion(outcome, criterion.id, 1)}
                    >
                      <ChevronDownIcon className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="secondary"
                      aria-label="Remove criterion"
                      onClick={() => onDeleteCriterion(criterion)}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-[var(--ink-soft)]">No criteria yet.</p>
        )}
        {canEdit ? (
          <form
            className="mt-2 flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              editor.addCriterion(outcome, criterionDraft, () => setCriterionDraft(""));
            }}
          >
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <span className="sr-only">New criterion</span>
              <Input
                value={criterionDraft}
                onChange={(event) => setCriterionDraft(event.target.value)}
                placeholder="Describe mitochondria's role"
              />
            </label>
            <Button type="submit" variant="secondary" disabled={!criterionDraft.trim()}>
              <PlusIcon className="h-4 w-4" aria-hidden />
              Add criterion
            </Button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
