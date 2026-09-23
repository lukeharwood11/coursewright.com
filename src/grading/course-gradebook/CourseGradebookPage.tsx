import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { Button, ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { Select } from "@/ui/Select";
import { Badge } from "@/ui/Badge";
import { formatGradeDisplay, percentToLabel } from "@/grading/model/scale";
import { reportCardPath, studentPath } from "@/grading/model/paths";
import { coursePath } from "@/courses/model/paths";
import type { GradebookRow } from "@/grading/databridge/gradebook";
import { AssignmentGradeForm } from "./components/AssignmentGradeForm";
import { useCourseGradebook } from "./hooks/useCourseGradebook";

export function CourseGradebookPage() {
  const book = useCourseGradebook();
  const [finalDrafts, setFinalDrafts] = useState<Record<number, { label: string; note: string }>>({});

  useEffect(() => {
    document.title = book.course
      ? `Gradebook · ${book.course.title} · Course Wright`
      : "Gradebook · Course Wright";
  }, [book.course]);

  if (book.loading) return <PageLoading label="Loading gradebook…" />;
  if (book.missing || !book.course || !book.scale) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1 className="text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          We couldn’t find that course
        </h1>
      </div>
    );
  }

  const scale = book.scale;
  const slug = book.organization.slug;

  function draftFor(row: GradebookRow) {
    return (
      finalDrafts[row.enrollmentId] ?? {
        label: row.overrideLabel ?? percentToLabel(row.finalPercent, scale) ?? "",
        note: row.overrideNote ?? "",
      }
    );
  }

  return (
    <div>
      <DetailPageHeader
        backTo={coursePath(slug, book.course.id)}
        backLabel="Back to course"
        title={`${book.course.title} gradebook`}
      />
      <div className="space-y-6 px-5 py-4 md:px-8">
        {book.bandsChanged ? (
          <p className="rounded-[8px] border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[14px] text-[var(--ink)]">
            The grading scale changed. Final overrides are still here. Confirm each one
            before you rely on it.
          </p>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Class</span>
            <Select
              value={book.classId == null ? "" : String(book.classId)}
              onChange={(event) =>
                book.setClassId(event.target.value ? Number(event.target.value) : null)
              }
              aria-label="Filter by class"
            >
              <option value="">All students</option>
              {book.classes.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.title}
                </option>
              ))}
            </Select>
          </label>
          <p className="max-w-md text-[13px] text-[var(--ink-soft)]">
            A class only filters this list. Grades belong to the course enrollment.
          </p>
        </div>

        <section>
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Needs a grade</h2>
          {book.needsGrade.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No grades waiting.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
              {book.needsGrade.map((item) => (
                <li key={item.attemptId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[14.5px] text-[var(--ink)]">
                    <span className="font-extrabold">{item.studentName}</span>
                    {" · "}
                    {item.title}
                  </span>
                  <Button type="button" variant="secondary" onClick={() => book.openAttempt(item.attemptId)}>
                    Save grade
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {book.attemptId != null ? (
          book.answersLoading ? (
            <PageLoading embedded label="Loading answers…" />
          ) : (
            <AssignmentGradeForm
              key={book.attemptId}
              answers={book.answers}
              note={book.note}
              saving={book.savingPoints}
              onNote={book.setNote}
              onClose={book.closeAttempt}
              onSave={book.savePoints}
            />
          )
        ) : null}

        <section className="overflow-x-auto">
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Students</h2>
          {book.rows.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No grades yet.</p>
          ) : (
            <table className="mt-3 w-full min-w-[40rem] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-[var(--line-soft)] text-[13px] text-[var(--ink-soft)]">
                  <th className="py-2 pr-3 font-bold">Student</th>
                  {book.quizzes.map((quiz) => (
                    <th key={quiz.id} className="py-2 pr-3 font-bold">
                      {quiz.title}
                    </th>
                  ))}
                  <th className="py-2 font-bold">Final</th>
                </tr>
              </thead>
              <tbody>
                {book.rows.map((row) => {
                  const draft = draftFor(row);
                  const shown = formatGradeDisplay({
                    percent: row.finalPercent,
                    scale,
                    overrideLabel:
                      scale.mode === "none" || !row.overrideLabel ? null : row.overrideLabel,
                  });
                  return (
                    <tr key={row.enrollmentId} className="border-b border-[var(--line-soft)] align-top">
                      <td className="py-3 pr-3">
                        <Link
                          to={studentPath(slug, row.studentProfileId)}
                          className="font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
                        >
                          {row.studentName}
                        </Link>
                      </td>
                      {book.quizzes.map((quiz) => {
                        const item = row.items.find((entry) => entry.quizId === quiz.id);
                        if (!item) {
                          return (
                            <td key={quiz.id} className="py-3 pr-3 text-[var(--ink-faint)]">
                              —
                            </td>
                          );
                        }
                        const cell = item.locked
                          ? formatGradeDisplay({ percent: item.percent, scale })
                          : "Needs grade";
                        return (
                          <td key={quiz.id} className="py-3 pr-3">
                            <button
                              type="button"
                              className="text-left font-semibold text-[var(--ink)] hover:text-[var(--green-deep)]"
                              onClick={() => book.openAttempt(item.attemptId)}
                            >
                              {cell}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-3">
                        <p className="font-extrabold text-[var(--ink)]">{shown}</p>
                        {row.overrideLabel && row.overriddenAt ? (
                          <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                            {row.overriddenByName ? `${row.overriddenByName} · ` : ""}
                            {new Date(row.overriddenAt).toLocaleString()}
                          </p>
                        ) : null}
                        {scale.mode === "none" ? null : (
                          <div className="mt-2 flex flex-col gap-2">
                            <Select
                              aria-label={`Final for ${row.studentName}`}
                              value={draft.label}
                              onChange={(event) =>
                                setFinalDrafts((current) => ({
                                  ...current,
                                  [row.enrollmentId]: { ...draft, label: event.target.value },
                                }))
                              }
                            >
                              <option value="">Use the average</option>
                              {scale.mode === "pass_fail" ? (
                                <>
                                  <option value="Pass">Pass</option>
                                  <option value="Fail">Fail</option>
                                </>
                              ) : (
                                scale.bands.map((band) => (
                                  <option key={band.label} value={band.label}>
                                    {band.label}
                                  </option>
                                ))
                              )}
                            </Select>
                            <textarea
                              aria-label={`Note for ${row.studentName}`}
                              className="min-h-16 rounded-[6px] border border-[var(--line)] px-2 py-1 text-[13px]"
                              value={draft.note}
                              onChange={(event) =>
                                setFinalDrafts((current) => ({
                                  ...current,
                                  [row.enrollmentId]: { ...draft, note: event.target.value },
                                }))
                              }
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={book.savingFinal || !draft.label}
                                onClick={() => book.saveFinal(row, draft.label, draft.note)}
                              >
                                Save final
                              </Button>
                              {row.overrideLabel ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={book.savingFinal}
                                  onClick={() => book.clearFinal(row)}
                                >
                                  Use the average
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Report card drafts</h2>
            <Button type="button" disabled={book.drafting} onClick={book.draftAll}>
              {book.drafting ? "Drafting…" : "Draft report cards"}
            </Button>
          </div>
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
            Drafts update from the gradebook. Send one card at a time.
          </p>
          {book.cards.length === 0 ? (
            <p className="mt-3 text-[14px] text-[var(--ink-soft)]">Generate report card</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
              {book.cards.map((card) => (
                <li key={card.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[14.5px] font-extrabold text-[var(--ink)]">
                    {card.snapshot.studentName}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={card.status === "draft" ? "neutral" : "green"}>{card.status}</Badge>
                    <ButtonLink variant="secondary" to={reportCardPath(slug, card.id)}>
                      {card.status === "draft" ? "Review" : "Open"}
                    </ButtonLink>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
