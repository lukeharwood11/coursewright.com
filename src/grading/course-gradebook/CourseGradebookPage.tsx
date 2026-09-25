import { useEffect, useState } from "react";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { Button, ButtonLink } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { Select } from "@/ui/Select";
import { Badge } from "@/ui/Badge";
import { percentToLabel } from "@/grading/model/scale";
import { ReportCardListActions } from "@/grading/report-card/components/ReportCardListActions";
import { studentPath } from "@/grading/model/paths";
import { coursePath } from "@/courses/model/paths";
import type { GradebookRow } from "@/grading/databridge/gradebook";
import { AssignmentGradeForm } from "./components/AssignmentGradeForm";
import { GradebookStudents } from "./components/GradebookStudents";
import { MaterialGradeForm } from "./components/MaterialGradeForm";
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <label className="flex w-full flex-col gap-1 sm:w-auto sm:min-w-[12rem]">
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
                <li
                  key={item.key}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="min-w-0 break-words text-[14.5px] text-[var(--ink)]">
                    <span className="font-extrabold">{item.studentName}</span>
                    {" · "}
                    {item.title}
                  </span>
                  {book.canGrade ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full shrink-0 sm:w-auto"
                      onClick={() => {
                        if (item.submissionId != null) book.openSubmission(item.submissionId);
                        else if (item.attemptId != null) book.openAttempt(item.attemptId);
                      }}
                    >
                      Save grade
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {book.canGrade && book.attemptId != null ? (
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

        {book.canGrade && book.submissionId != null ? (
          book.materialDraftLoading || book.materialsLoading || !book.materialDraft ? (
            <PageLoading embedded label="Loading submission…" />
          ) : (
            <MaterialGradeForm
              key={book.submissionId}
              title={
                book.needsGrade.find((item) => item.submissionId === book.submissionId)?.title ??
                book.materials.find((material) =>
                  book.rows.some((row) =>
                    row.items.some(
                      (item) =>
                        item.submissionId === book.submissionId && item.materialId === material.id,
                    ),
                  ),
                )?.title ??
                "Material"
              }
              gradable={
                book.materials.some((material) =>
                  book.rows.some((row) =>
                    row.items.some(
                      (item) =>
                        item.submissionId === book.submissionId && item.materialId === material.id,
                    ),
                  ),
                )
              }
              possible={
                book.materials.find((material) =>
                  book.rows.some((row) =>
                    row.items.some(
                      (item) =>
                        item.submissionId === book.submissionId && item.materialId === material.id,
                    ),
                  ),
                )?.pointsPossible ?? book.materialDraft.pointsPossible
              }
              earned={book.materialDraft.pointsEarned}
              feedback={book.materialDraft.feedback}
              saving={book.savingMaterial}
              onClose={book.closeSubmission}
              onSave={book.saveMaterial}
            />
          )
        ) : null}

        <section>
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Students</h2>
          <GradebookStudents
            rows={book.rows}
            quizzes={book.quizzes}
            materials={book.materials}
            scale={scale}
            canGrade={book.canGrade}
            studentPathFor={(studentProfileId) => studentPath(slug, studentProfileId)}
            draftFor={draftFor}
            savingFinal={book.savingFinal}
            onDraftChange={(enrollmentId, draft) =>
              setFinalDrafts((current) => ({ ...current, [enrollmentId]: draft }))
            }
            onSaveFinal={(row, label, note) => book.saveFinal(row, label, note)}
            onClearFinal={(row) => book.clearFinal(row)}
            onOpenAttempt={book.openAttempt}
            onOpenSubmission={book.openSubmission}
          />
        </section>

        <section>
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Report cards</h2>
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">
            Draft one student at a time for this course. Send each card from its review page.
          </p>
          {book.rows.length === 0 ? (
            <p className="mt-3 text-[14px] text-[var(--ink-soft)]">No active enrollments.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
              {book.rows.map((row) => {
                const card = book.cards.find(
                  (entry) => entry.enrollmentId === row.enrollmentId,
                );
                const draft = card?.status === "draft" ? card : null;
                const sent = card && card.status !== "draft" ? card : null;
                return (
                  <li
                    key={row.enrollmentId}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <span className="min-w-0 break-words text-[14.5px] font-extrabold text-[var(--ink)]">
                      {row.studentName}
                    </span>
                    <span className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                      {sent ? (
                        <>
                          <Badge variant="green">{sent.status}</Badge>
                          <ReportCardListActions
                            orgSlug={slug}
                            card={sent}
                            canManage={book.canGrade}
                            courseId={book.course.id}
                          />
                        </>
                      ) : draft ? (
                        <>
                          <Badge variant="neutral">draft</Badge>
                          <ReportCardListActions
                            orgSlug={slug}
                            card={draft}
                            openLabel="Review"
                            canManage={book.canGrade}
                            courseId={book.course.id}
                          />
                        </>
                      ) : book.canGrade ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={book.draftingEnrollmentId === row.enrollmentId}
                          onClick={() => book.draftForEnrollment(row.enrollmentId)}
                        >
                          {book.draftingEnrollmentId === row.enrollmentId
                            ? "Drafting…"
                            : "Draft report card"}
                        </Button>
                      ) : (
                        <span className="text-[14px] text-[var(--ink-soft)]">No draft</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
