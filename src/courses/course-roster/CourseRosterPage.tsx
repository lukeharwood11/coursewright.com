import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { coursePath, coursesPath } from "@/courses/model/paths";
import { AddStudentForm } from "@/roster/student-profile/components/AddStudentForm";
import { ExistingStudentPicker } from "@/roster/student-profile/components/ExistingStudentPicker";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { useCourseRoster } from "./hooks/useCourseRoster";
import { useCourseParentInvites } from "./hooks/useCourseParentInvites";

export function CourseRosterPage() {
  const roster = useCourseRoster();
  const students = roster.enrollments.map((enrollment) => enrollment.student);
  const parentInvites = useCourseParentInvites(students);

  useEffect(() => {
    document.title = roster.course
      ? `Roster · ${roster.course.title} · Course Wright`
      : "Course roster · Course Wright";
  }, [roster.course]);

  if (roster.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading roster…</p>
      </div>
    );
  }

  if (!roster.canEdit || roster.notFound || !roster.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that course
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          This roster isn’t available.
        </p>
        {roster.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{roster.error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={coursesPath(roster.organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to courses
          </Link>
        </p>
      </div>
    );
  }

  const enrollmentIdByStudent = new Map(
    roster.enrollments.map((enrollment) => [enrollment.student.id, enrollment.id]),
  );
  const base = `/my/${roster.organization.slug}`;

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Course roster
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{roster.course.title}</p>
      <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Students are optional. You can print materials without anyone on this
        list.
      </p>
      <p className="mt-2 text-[13px]">
        <Link
          to={coursePath(roster.organization.slug, roster.course.id)}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to course
        </Link>
        <span className="text-[var(--ink-faint)]"> · </span>
        <Link
          to={`${base}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Org roster
        </Link>
      </p>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <ExistingStudentPicker
            students={roster.availableStudents}
            selectedId={roster.selectedId}
            saving={roster.addingExisting}
            error={roster.existingError}
            onSelect={roster.setSelectedId}
            onAdd={roster.onAddExisting}
          />
          {roster.availableStudents.length === 0 ? (
            <p className="text-[14px] leading-relaxed text-[var(--ink-soft)]">
              {roster.enrollments.length === 0
                ? "No one in the org yet. Add a new student to create their profile and enroll them."
                : "Everyone already in the org is enrolled here. Add a new student below."}
            </p>
          ) : null}
        </section>

        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
            Add a new student
          </h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Creates their org profile and enrolls them in this course.
          </p>
          <div className="mt-4">
            <AddStudentForm
              name={roster.name}
              parentEmail={roster.parentEmail}
              gradeLevel={roster.gradeLevel}
              gradeLabels={roster.gradeLabels}
              error={roster.newError}
              saving={roster.addingNew}
              submitLabel="Add to course"
              onNameChange={roster.setName}
              onParentEmailChange={roster.setParentEmail}
              onGradeLevelChange={roster.setGradeLevel}
              onSubmit={roster.onAddNew}
            />
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Enrolled</h2>
        <StudentRosterList
          students={students}
          orgSlug={roster.organization.slug}
          emptyMessage="No students enrolled yet. Printing this course does not require a roster."
          trailing={(student) => {
            const enrollmentId = enrollmentIdByStudent.get(student.id);
            const pending = parentInvites.pendingByStudent.get(student.id);
            const linked = parentInvites.linkedStudentIds.has(student.id);
            return (
              <span className="flex flex-wrap items-center justify-end gap-2">
                {parentInvites.canInvite && linked ? (
                  <span className="text-[12.5px] text-[var(--ink-faint)]">Parent linked</span>
                ) : null}
                {parentInvites.canInvite && pending && !linked ? (
                  <Button
                    variant="secondary"
                    onClick={() => parentInvites.onCopy(student.id)}
                  >
                    {parentInvites.copiedId === pending.id ? "Copied" : "Copy invite"}
                  </Button>
                ) : null}
                {parentInvites.canInvite && student.parentEmail && !pending && !linked ? (
                  <Button
                    variant="secondary"
                    onClick={() => parentInvites.onInvite(student)}
                    disabled={parentInvites.invitingStudentId === student.id}
                  >
                    {parentInvites.invitingStudentId === student.id
                      ? "Inviting…"
                      : "Invite parent"}
                  </Button>
                ) : null}
                {enrollmentId ? (
                  <Button
                    variant="secondary"
                    onClick={() => roster.onUnenroll(enrollmentId)}
                    disabled={roster.unenrollingId === enrollmentId}
                  >
                    {roster.unenrollingId === enrollmentId ? "Removing…" : "Unenroll"}
                  </Button>
                ) : null}
              </span>
            );
          }}
        />
      </section>
    </div>
  );
}
