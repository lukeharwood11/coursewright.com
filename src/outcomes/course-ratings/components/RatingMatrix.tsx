import { CheckIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { courseOutcomesPath, orgOutcomesSettingsPath } from "@/outcomes/model/paths";
import { Button, ButtonLink } from "@/ui/Button";
import { Select } from "@/ui/Select";
import type { useCourseRatings } from "../hooks/useCourseRatings";

type Matrix = ReturnType<typeof useCourseRatings>;

export function RatingMatrix({ matrix }: { matrix: Matrix }) {
  const slug = matrix.organization.slug;
  const courseId = matrix.course?.id;

  if (!courseId) return null;

  if (matrix.targets.length === 0) {
    return (
      <div className="mt-6 max-w-xl">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          Add at least one outcome before rating students.
        </p>
        <ButtonLink className="mt-3" to={courseOutcomesPath(slug, courseId)} variant="secondary">
          Edit outcomes
        </ButtonLink>
      </div>
    );
  }

  if (matrix.options.length === 0) {
    return (
      <p className="mt-6 max-w-xl text-[14.5px] text-[var(--ink-soft)]">
        This organization has no active rating words. An owner or admin can add
        them in{" "}
        <Link className="font-bold text-[var(--green)]" to={orgOutcomesSettingsPath(slug)}>
          Outcomes settings
        </Link>
        .
      </p>
    );
  }

  if (matrix.students.length === 0) {
    return (
      <p className="mt-6 max-w-xl text-[14.5px] text-[var(--ink-soft)]">
        Enroll students before rating outcomes.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[14px] text-[var(--ink-soft)]">
          {matrix.cycleLabel ? `${matrix.cycleLabel}. ` : ""}
          Pick a rating for each part. You can leave some blank. Families see
          these after you submit.
        </p>
        {matrix.canEdit ? (
          <Button type="button" disabled={matrix.submitting} onClick={matrix.submitPackage}>
            <CheckIcon className="h-4 w-4" aria-hidden />
            {matrix.submitting ? "Submitting…" : "Submit outcomes"}
          </Button>
        ) : null}
      </div>
      {matrix.packageSubmittedAt ? (
        <p className="text-[13px] text-[var(--ink-soft)]">
          Submitted {formatSubmitted(matrix.packageSubmittedAt)}. You can change
          ratings and submit again.
        </p>
      ) : (
        <p className="text-[13px] text-[var(--ink-faint)]">Not submitted yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {matrix.students.map((student) => (
          <li
            key={student.id}
            className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          >
            <h2 className="text-[15px] font-extrabold text-[var(--ink)]">{student.name}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {matrix.targets.map((target) => {
                const selected = matrix.cellOptionId(student.id, target);
                return (
                  <li key={target.key} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
                    <div>
                      <p className="text-[14px] text-[var(--ink)]">
                        {target.criterionStatement ?? target.outcomeStatement}
                      </p>
                      {target.criterionStatement ? (
                        <p className="text-[12px] text-[var(--ink-faint)]">{target.outcomeStatement}</p>
                      ) : null}
                    </div>
                    <Select
                      wrapperClassName="w-full"
                      aria-label={`${student.name}: ${target.criterionStatement ?? target.outcomeStatement}`}
                      disabled={!matrix.canEdit || matrix.saving}
                      value={selected == null ? "" : String(selected)}
                      onChange={(event) => {
                        const value = event.target.value;
                        matrix.setCell(
                          student.id,
                          target,
                          value ? Number(value) : null,
                        );
                      }}
                    >
                      <option value="">Not rated</option>
                      {matrix.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSubmitted(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
