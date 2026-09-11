import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { AddStudentForm } from "@/roster/student-profile/components/AddStudentForm";
import { ExistingStudentPicker } from "@/roster/student-profile/components/ExistingStudentPicker";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { useClassRoster } from "./hooks/useClassRoster";

export function ClassRosterPage() {
  const roster = useClassRoster();

  useEffect(() => {
    document.title = roster.classGroup
      ? `${roster.classGroup.title} · Course Wright`
      : "Class · Course Wright";
  }, [roster.classGroup]);

  if (roster.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading class…</p>
      </div>
    );
  }

  if (roster.notFound || !roster.classGroup) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that class
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        {roster.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{roster.error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${roster.organization.slug}/roster`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to roster
          </Link>
        </p>
      </div>
    );
  }

  const students = roster.members.map((member) => member.student);
  const memberIdByStudent = new Map(
    roster.members.map((member) => [member.student.id, member.id]),
  );

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {roster.classGroup.title}
      </h1>
      <p className="mt-1 max-w-xl text-[14px] text-[var(--ink-soft)]">
        A class is a group of students — not a course. Adding someone here does
        not enroll them in a course.
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
              {roster.members.length === 0
                ? "No one in the org yet. Add a new student to create their profile and put them in this class."
                : "Everyone already in the org is in this class. Add a new student below."}
            </p>
          ) : null}
        </section>

        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
            Add a new student
          </h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Creates their org profile and adds them to this class.
          </p>
          <div className="mt-4">
            <AddStudentForm
              name={roster.name}
              parentEmail={roster.parentEmail}
              gradeLevel={roster.gradeLevel}
              gradeLabels={roster.gradeLabels}
              error={roster.newError}
              saving={roster.addingNew}
              submitLabel="Add to class"
              onNameChange={roster.setName}
              onParentEmailChange={roster.setParentEmail}
              onGradeLevelChange={roster.setGradeLevel}
              onSubmit={roster.onAddNew}
            />
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Students</h2>
        <StudentRosterList
          students={students}
          orgSlug={roster.organization.slug}
          emptyMessage="No students in this class yet."
          trailing={(student) => {
            const memberId = memberIdByStudent.get(student.id);
            if (!memberId) return null;
            return (
              <Button
                variant="secondary"
                onClick={() => roster.onRemove(memberId)}
                disabled={roster.removingId === memberId}
              >
                {roster.removingId === memberId ? "Removing…" : "Remove"}
              </Button>
            );
          }}
        />
      </section>

      <p className="mt-6 text-[13px]">
        <Link
          to={`/my/${roster.organization.slug}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to roster
        </Link>
      </p>
    </div>
  );
}
