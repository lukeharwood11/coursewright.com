import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { StudentAttendanceSection } from "@/attendance";
import { StudentPeriodFeedbackSection } from "@/grading/period-feedback/components/StudentPeriodFeedbackSection";
import { StudentOutcomesSection } from "@/outcomes";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { PageLoading } from "@/ui/PageLoading";
import { Select } from "@/ui/Select";
import { studentsHubTier } from "@/grading/model/access";
import { formatGradeDisplay } from "@/grading/model/scale";
import { reportCardPath, studentsPath } from "@/grading/model/paths";
import { useAckNotificationFromSearch } from "@/notifications/activity/hooks/useAckNotificationFromSearch";
import { useProgress } from "./hooks/useProgress";

export function ProgressPage() {
  const progress = useProgress();
  useAckNotificationFromSearch();
  const { role, parentPresentation, staffViewMode } = useOrgShell();
  const tier = studentsHubTier(role, parentPresentation);

  useEffect(() => {
    document.title = `Progress · ${progress.organization.name} · Course Wright`;
  }, [progress.organization.name]);

  if (!role) {
    return <PageLoading label="Loading progress…" />;
  }

  // Staff Preview has no linked student — send them home.
  if (staffViewMode === "preview" && parentPresentation) {
    return <Navigate to={`/my/${progress.organization.slug}`} replace />;
  }

  if (tier !== "learner" && role !== "parent") {
    return <Navigate to={studentsPath(progress.organization.slug)} replace />;
  }

  if (progress.loading || !progress.scale) {
    return <PageLoading label="Loading progress…" />;
  }

  const slug = progress.organization.slug;

  if (!progress.student) {
    return (
      <div className="px-5 py-4 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Progress
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          {progress.parentViewer
            ? "This view shows a linked student’s classes, grades, and attendance. It stays empty until a student is linked to this account."
            : "This view is for your own classes and grades. It stays empty until this account is linked to a student."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-4 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Progress
      </h1>
      {progress.parentViewer && progress.children.length > 1 ? (
        <label className="block max-w-xs">
          <span className="block text-[12px] font-bold text-[var(--ink-soft)]">Student</span>
          <Select
            value={String(progress.student.id)}
            onChange={(event) => progress.selectStudent(Number(event.target.value))}
          >
            {progress.children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </Select>
        </label>
      ) : (
        <p className="text-[14.5px] text-[var(--ink-soft)]">{progress.student.name}</p>
      )}

      <section>
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Classes</h2>
        {progress.classes.length === 0 ? (
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No classes yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
            {progress.classes.map((classGroup) => (
              <li key={classGroup.id}>
                <Link
                  to={`/my/${slug}/classes/${classGroup.id}`}
                  className="block px-4 py-3 text-[15px] font-extrabold text-[var(--ink)] hover:bg-[var(--green-tint)]"
                >
                  {classGroup.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StudentAttendanceSection studentId={progress.student.id} />
      <StudentOutcomesSection studentId={progress.student.id} />
      <StudentPeriodFeedbackSection studentId={progress.student.id} />

      <section>
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Grades</h2>
        {progress.grades.length === 0 ? (
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No grades yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
            {progress.grades.map((grade) => (
              <li key={grade.enrollmentId} className="px-4 py-3">
                <p className="text-[15px] font-extrabold text-[var(--ink)]">{grade.courseTitle}</p>
                <p className="text-[13.5px] text-[var(--ink-soft)]">
                  {formatGradeDisplay({
                    percent: grade.finalPercent,
                    scale: progress.scale!,
                    overrideLabel: grade.overrideLabel,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Report cards</h2>
        {progress.cards.length === 0 ? (
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No report cards yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
            {progress.cards.map((card) => (
              <li key={card.id}>
                <Link
                  to={reportCardPath(slug, card.id)}
                  className="block px-4 py-3 text-[15px] font-extrabold text-[var(--ink)] hover:bg-[var(--green-tint)]"
                >
                  {card.snapshot.courseTitle}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
