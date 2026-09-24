import { Link } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { Button, ButtonLink } from "@/ui/Button";
import { formatGradeDisplay } from "@/grading/model/scale";
import { gradebookPath, gradingSettingsPath, reportCardPath } from "@/grading/model/paths";
import { canEditGradingScale } from "@/grading/model/access";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { useStudentGrades } from "../hooks/useStudentGrades";

export function StudentGradesSection({ studentId }: { studentId: number }) {
  const { role } = useOrgShell();
  const grades = useStudentGrades(studentId);
  if (!grades.scale) return null;
  const slug = grades.organization.slug;

  return (
    <div className="space-y-4">
      <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Grades</h2>
          {canEditGradingScale(role) && grades.canAct ? (
            <Link
              to={gradingSettingsPath(slug)}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--green)]"
            >
              <Cog6ToothIcon className="h-4 w-4" aria-hidden />
              Grading settings
            </Link>
          ) : null}
        </div>
        {grades.grades.length === 0 ? (
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No grades yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line-soft)]">
            {grades.grades.map((grade) => (
              <li key={grade.enrollmentId} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-[14.5px] font-extrabold text-[var(--ink)]">{grade.courseTitle}</p>
                  <p className="text-[13px] text-[var(--ink-soft)]">
                    {formatGradeDisplay({
                      percent: grade.finalPercent,
                      scale: grades.scale!,
                      overrideLabel: grade.overrideLabel,
                    })}
                  </p>
                  {grade.overrideLabel && grade.overriddenAt ? (
                    <p className="text-[12px] text-[var(--ink-faint)]">
                      {grade.overriddenByName ? `${grade.overriddenByName} · ` : ""}
                      {new Date(grade.overriddenAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                {grades.canAct ? (
                  <ButtonLink variant="secondary" to={gradebookPath(slug, grade.courseId)}>
                    Gradebook
                  </ButtonLink>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {grades.canAct ? (
        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Report cards</h2>
            <Button type="button" disabled={grades.generating} onClick={grades.generate}>
              {grades.generating ? "Generating…" : "Generate"}
            </Button>
          </div>
          {grades.cards.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">Generate report card</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line-soft)]">
              {grades.cards.map((card) => (
                <li key={card.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-[14.5px] font-extrabold text-[var(--ink)]">
                    {card.snapshot.courseTitle}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={card.status === "draft" ? "neutral" : "green"}>{card.status}</Badge>
                    <ButtonLink variant="secondary" to={reportCardPath(slug, card.id)}>
                      Open
                    </ButtonLink>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
