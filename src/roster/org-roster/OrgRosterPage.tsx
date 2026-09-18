import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { BatchCreateStudentsForm } from "@/roster/student-profile/components/BatchCreateStudentsForm";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { AssignSelectedBar } from "./components/AssignSelectedBar";
import { useOrgRoster } from "./hooks/useOrgRoster";

export function OrgRosterPage() {
  const roster = useOrgRoster();

  useEffect(() => {
    document.title = `Roster · ${roster.organization.name} · Course Wright`;
  }, [roster.organization.name]);

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Roster
      </h1>
      <p className="mt-1 max-w-2xl text-[14px] text-[var(--ink-soft)]">
        Student profiles for this organization. Select people to add to a class
        or enroll in a course. Course enrollments also live on each course.
      </p>

      {roster.loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading roster…</p>
      ) : null}

      {roster.error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {roster.error}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
            Students
          </h2>
          <div className="flex min-w-[12rem] flex-1 flex-wrap items-end justify-end gap-3 sm:max-w-xl">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 sm:max-w-xs">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                Find a student
              </span>
              <Input
                value={roster.query}
                onChange={(event) => roster.setQuery(event.target.value)}
                placeholder="Name, grade, or parent email"
              />
            </label>
            {!roster.panelOpen ? (
              <Button type="button" onClick={roster.openPanel}>
                Add students
              </Button>
            ) : null}
          </div>
        </div>

        {!roster.loading && roster.students.length === 0 && !roster.query ? (
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            No student profiles yet. Add students here, or when you enroll
            someone in a course or class. You can still print courses without a
            roster.
          </p>
        ) : (
          <StudentRosterList
            students={roster.students}
            orgSlug={roster.organization.slug}
            emptyMessage="No students match that search."
            selectedIds={roster.selectedIds}
            onToggle={roster.onToggle}
            onSelectAll={roster.onSelectAllMatching}
            onClearSelection={roster.onClearSelection}
          />
        )}

        <AssignSelectedBar
          selectedCount={roster.selectedIds.length}
          classes={roster.classes}
          courses={roster.courses}
          classId={roster.assignClassId}
          courseId={roster.assignCourseId}
          saving={roster.assigning}
          error={roster.assignError}
          onClassIdChange={roster.setAssignClassId}
          onCourseIdChange={roster.setAssignCourseId}
          onAddToClass={roster.onAddToClass}
          onEnrollInCourse={roster.onEnrollInCourse}
          onClear={roster.onClearSelection}
        />
      </section>

      {roster.panelOpen ? (
        <section className="mt-6 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
                Add students
              </h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                Name is enough. Parent email and grade are optional. Paste several
                names at once when onboarding a cohort.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={roster.closePanel}>
              Close
            </Button>
          </div>
          <div className="mt-4">
            <BatchCreateStudentsForm
              drafts={roster.drafts}
              pasteText={roster.pasteText}
              gradeLabels={roster.gradeLabels}
              error={roster.studentError}
              saving={roster.addingStudents}
              submitLabel={(count) =>
                count === 1 ? "Add 1 student" : `Add ${count} students`
              }
              onDraftChange={roster.setDraft}
              onAddRow={roster.onAddRow}
              onRemoveRow={roster.onRemoveRow}
              onPasteTextChange={roster.setPasteText}
              onApplyPaste={roster.onApplyPaste}
              onSubmit={roster.onAddStudents}
            />
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
              Classes
            </h2>
            <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              Named groups of students — not a course, and no materials. Select
              students above to add them here, or open a class to manage members.
            </p>
          </div>
          {!roster.creatingClassOpen ? (
            <Button type="button" variant="secondary" onClick={roster.openCreateClass}>
              <PlusIcon className="h-5 w-5" aria-hidden />
              Create class
            </Button>
          ) : null}
        </div>

        {roster.creatingClassOpen ? (
          <form
            className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row"
            onSubmit={roster.onCreateClass}
          >
            <Input
              className="min-w-0 flex-1"
              value={roster.classTitle}
              onChange={(event) => roster.setClassTitle(event.target.value)}
              placeholder="Wednesday cohort"
              disabled={roster.creatingClass}
            />
            <Button type="submit" disabled={roster.creatingClass}>
              {roster.creatingClass ? "Creating…" : "Create"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={roster.creatingClass}
              onClick={roster.closeCreateClass}
            >
              Cancel
            </Button>
          </form>
        ) : null}

        {roster.classError ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
            {roster.classError}
          </p>
        ) : null}

        {roster.classes.length === 0 ? (
          <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            No classes yet. Create one when you want a cohort separate from a
            course.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)]">
            {roster.classes.map((classGroup) => (
              <li key={classGroup.id}>
                <Link
                  to={`/my/${roster.organization.slug}/classes/${classGroup.id}`}
                  className="block px-4 py-3 text-[15.5px] font-extrabold text-[var(--ink)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
                >
                  {classGroup.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
