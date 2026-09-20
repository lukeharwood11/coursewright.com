import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { coursePath, coursesPath } from "@/courses/model/paths";
import { AddStudentsPanel } from "@/roster/student-profile/components/AddStudentsPanel";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { InstructorsSection } from "@/courses/instructors/InstructorsSection";
import { useCourseRoster } from "./hooks/useCourseRoster";
import { useCourseParentInvites } from "./hooks/useCourseParentInvites";
import { useToastOnError } from "@/ui/useToastOnError";

export function CourseRosterPage() {
  const roster = useCourseRoster();
  useToastOnError(roster.error);
  const students = roster.enrollments.map((enrollment) => enrollment.student);
  const parentInvites = useCourseParentInvites(students);

  useEffect(() => {
    document.title = roster.course
      ? `Roster · ${roster.course.title} · Course Wright`
      : "Course roster · Course Wright";
  }, [roster.course]);

  if (roster.loading) {
    return (
      <PageLoading label="Loading roster…" />
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
    roster.enrollments.map((enrollment) => [
      enrollment.student.id,
      enrollment.id,
    ]),
  );
  const base = `/my/${roster.organization.slug}`;

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Roster
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{roster.course.title}</p>
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

      <div className="mt-8">
        <InstructorsSection
          orgSlug={roster.organization.slug}
          instructors={roster.instructors}
          staff={roster.staff}
          canManage={roster.canManageInstructors}
          addUserId={roster.addUserId}
          onAddUserId={roster.setAddUserId}
          onAdd={roster.addInstructor}
          onRemove={roster.onRemoveInstructor}
          adding={roster.addingInstructor}
          addError={roster.addInstructorError}
        />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
            Enrolled
          </h2>
          {!roster.panelOpen ? (
            <Button type="button" onClick={roster.openPanel}>
              <UserPlusIcon className="h-5 w-5" aria-hidden />
              Enroll students
            </Button>
          ) : null}
        </div>
        <StudentRosterList
          students={students}
          orgSlug={roster.organization.slug}
          emptyMessage="No students enrolled yet. Printing this course does not require a roster."
          trailing={(student) => {
            const enrollmentId = enrollmentIdByStudent.get(student.id);
            const pending = parentInvites.pendingByStudent.get(student.id) ?? [];
            const linkedCount = parentInvites.linkedByStudent.get(student.id)?.length ?? 0;
            const firstPending = pending[0];
            return (
              <span className="flex flex-wrap items-center justify-end gap-2">
                {parentInvites.canInvite && linkedCount > 0 ? (
                  <span className="text-[12.5px] text-[var(--ink-faint)]">
                    {linkedCount === 1
                      ? "1 parent linked"
                      : `${linkedCount} parents linked`}
                  </span>
                ) : null}
                {parentInvites.canInvite && firstPending ? (
                  <Button
                    variant="secondary"
                    onClick={() => parentInvites.onCopy(student.id)}
                  >
                    {parentInvites.copiedId === firstPending.id
                      ? "Copied"
                      : pending.length > 1
                        ? `Copy invite (${pending.length})`
                        : "Copy invite"}
                  </Button>
                ) : null}
                {parentInvites.canInvite &&
                parentInvites.canInviteSavedEmail(student) ? (
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

      <AddStudentsPanel
        open={roster.panelOpen}
        onClose={roster.closePanel}
        title="Enroll students"
        tab={roster.tab}
        onTabChange={roster.setTab}
        students={roster.availableStudents}
        selectedIds={roster.selectedIds}
        existingError={roster.existingError}
        existingSaving={roster.addingExisting}
        existingConfirmLabel={(count) =>
          count === 1 ? "Enroll 1 student" : `Enroll ${count} students`
        }
        existingEmptyMessage={
          roster.enrollments.length === 0
            ? "No one in the org yet. Create new students to enroll them here."
            : "Everyone already in the org is enrolled here. Create new students, or manage people on the org roster."
        }
        classPresets={roster.classes}
        selectedClassId={roster.selectedClassId}
        onSelectClass={roster.onSelectClass}
        onToggle={roster.onToggle}
        onSelectFiltered={roster.onSelectFiltered}
        onClear={roster.onClearSelection}
        onConfirmExisting={roster.onConfirmExisting}
        drafts={roster.drafts}
        pasteText={roster.pasteText}
        gradeLabels={roster.gradeLabels}
        newError={roster.newError}
        newSaving={roster.addingNew}
        newSubmitLabel={(count) =>
          count === 1
            ? "Create and enroll 1 student"
            : `Create and enroll ${count} students`
        }
        onDraftChange={roster.setDraft}
        onAddRow={roster.onAddRow}
        onRemoveRow={roster.onRemoveRow}
        onPasteTextChange={roster.setPasteText}
        onApplyPaste={roster.onApplyPaste}
        onSubmitNew={roster.onSubmitNew}
      />
    </div>
  );
}
