import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { AddStudentForm } from "@/roster/student-profile/components/AddStudentForm";
import { ExistingStudentPicker } from "@/roster/student-profile/components/ExistingStudentPicker";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { FamilyParentList } from "./components/FamilyParentList";
import { LinkParentPicker } from "./components/LinkParentPicker";
import { useFamily } from "./hooks/useFamily";

export function FamilyPage() {
  const family = useFamily();

  useEffect(() => {
    document.title = family.title
      ? `${family.title} · Course Wright`
      : "Family · Course Wright";
  }, [family.title]);

  if (family.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading family…</p>
      </div>
    );
  }

  if (family.notFound || !family.family || !family.title) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that family
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        {family.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{family.error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${family.organization.slug}/families`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to families
          </Link>
        </p>
      </div>
    );
  }

  const students = family.students.map((member) => member.student);
  const memberIdByStudent = new Map(
    family.students.map((member) => [member.student.id, member.memberId]),
  );
  const studentNames = new Map(students.map((student) => [student.id, student.name]));

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {family.title}
      </h1>
      <p className="mt-1 max-w-2xl text-[14px] text-[var(--ink-soft)]">
        A family is a named group of students — like a class, not a course.
        Parents listed here come from parent–student links. Adding someone to
        the family does not share materials or enroll them.
      </p>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <ExistingStudentPicker
            students={family.availableStudents}
            selectedId={family.selectedStudentId}
            saving={family.addingExisting}
            error={family.existingError}
            onSelect={family.setSelectedStudentId}
            onAdd={family.onAddExisting}
          />
          {family.availableStudents.length === 0 ? (
            <p className="text-[14px] leading-relaxed text-[var(--ink-soft)]">
              {students.length === 0
                ? "No one in the org yet, or every student is already in a family. Add a new student to create their profile and put them in this group."
                : "Every student in the org is already in a family. Add a new student below, or remove someone from another family first."}
            </p>
          ) : null}
        </section>

        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">
            Add a new student
          </h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Creates their org profile and adds them to this family.
          </p>
          <div className="mt-4">
            <AddStudentForm
              name={family.name}
              parentEmail={family.parentEmail}
              gradeLevel={family.gradeLevel}
              gradeLabels={family.gradeLabels}
              error={family.newError}
              saving={family.addingNew}
              submitLabel="Add to family"
              onNameChange={family.setName}
              onParentEmailChange={family.setParentEmail}
              onGradeLevelChange={family.setGradeLevel}
              onSubmit={family.onAddNew}
            />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <LinkParentPicker
          students={students}
          people={family.orgPeople}
          linkStudentId={family.linkStudentId}
          selectedParentId={family.selectedParentId}
          email={family.linkEmail}
          saving={family.addingParent}
          error={family.parentError}
          onStudentSelect={family.setLinkStudentId}
          onParentSelect={family.setSelectedParentId}
          onEmailChange={family.setLinkEmail}
          onAdd={family.onAddParent}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Students</h2>
        <StudentRosterList
          students={students}
          orgSlug={family.organization.slug}
          emptyMessage="No students in this family yet. Empty families are fine."
          trailing={(student) => {
            const memberId = memberIdByStudent.get(student.id);
            if (!memberId) return null;
            return (
              <Button
                variant="secondary"
                onClick={() => family.onRemove(memberId)}
                disabled={family.removingId === memberId}
              >
                {family.removingId === memberId ? "Removing…" : "Remove"}
              </Button>
            );
          }}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Parents</h2>
        <p className="mt-1 max-w-xl text-[13.5px] text-[var(--ink-soft)]">
          Derived from parent–student links. Removing a student from the family
          does not drop those links or course enrollments.
        </p>
        <FamilyParentList
          parents={family.parents}
          pendingInvites={family.pendingInvites}
          studentNames={studentNames}
        />
      </section>

      <p className="mt-6 text-[13px]">
        <Link
          to={`/my/${family.organization.slug}/families`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to families
        </Link>
        {" · "}
        <Link
          to={`/my/${family.organization.slug}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Roster
        </Link>
      </p>
    </div>
  );
}
