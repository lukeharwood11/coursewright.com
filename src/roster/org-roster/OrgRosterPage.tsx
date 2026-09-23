import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { canEditGradingScale, studentsHubTier } from "@/grading/model/access";
import { gradingSettingsPath, progressPath } from "@/grading/model/paths";
import { canManageOrgSettings } from "@/organizations/model/role";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import type { StudentSummary } from "@/roster/databridge/students";
import { listClassMembershipLabels } from "@/roster/databridge/classes";
import { PageLoading } from "@/ui/PageLoading";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { BatchCreateStudentsForm } from "@/roster/student-profile/components/BatchCreateStudentsForm";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { AssignSelectedBar } from "./components/AssignSelectedBar";
import { useOrgRoster } from "./hooks/useOrgRoster";
import { useToastOnError } from "@/ui/useToastOnError";

export function OrgRosterPage() {
  const roster = useOrgRoster();
  const { role, parentPresentation } = useOrgShell();
  const tier = studentsHubTier(role, parentPresentation);
  const canAct = tier === "actions";
  const canRemove = canManageOrgSettings(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "classes" ? "classes" : "students";
  const [classFilter, setClassFilter] = useState("");
  const [pendingRemove, setPendingRemove] = useState<StudentSummary | null>(null);
  const membershipsQuery = useQuery({
    queryKey: ["class-membership-labels", roster.organization.id],
    queryFn: () => listClassMembershipLabels(roster.organization.id),
  });
  useToastOnError(roster.error);

  const classNames = useMemo(() => {
    const names = new Map<number, string[]>();
    for (const row of membershipsQuery.data ?? []) {
      const current = names.get(row.studentProfileId) ?? [];
      current.push(row.title);
      names.set(row.studentProfileId, current);
    }
    return names;
  }, [membershipsQuery.data]);

  const visibleStudents = roster.students.filter((student) => {
    if (!classFilter) return true;
    return (membershipsQuery.data ?? []).some(
      (row) => row.studentProfileId === student.id && String(row.classId) === classFilter,
    );
  });

  useEffect(() => {
    document.title = `Students · ${roster.organization.name} · Course Wright`;
  }, [roster.organization.name]);

  if (tier === "learner") {
    return <Navigate to={progressPath(roster.organization.slug)} replace />;
  }

  return (
    <div className="space-y-6 px-5 py-4 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Students
        </h1>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:max-w-xl">
          {canEditGradingScale(role) ? (
            <Link
              to={gradingSettingsPath(roster.organization.slug)}
              className="text-[13px] font-bold text-[var(--green)]"
            >
              Grading settings
            </Link>
          ) : null}
          {tab === "students" ? (
            <Input
              className="min-w-[12rem] flex-1 sm:max-w-xs"
              value={roster.query}
              onChange={(event) => roster.setQuery(event.target.value)}
              placeholder="Find a student"
              aria-label="Find a student"
            />
          ) : null}
          {canAct && tab === "students" && !roster.panelOpen ? (
            <Button type="button" onClick={roster.openPanel}>
              <UserPlusIcon className="h-5 w-5" aria-hidden />
              Add students
            </Button>
          ) : null}
        </div>
      </div>

      {roster.loading ? (
        <PageLoading embedded label="Loading roster…" />
      ) : null}

      <div className="flex gap-2" role="tablist" aria-label="Students sections">
        {(["students", "classes"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={[
              "rounded-full px-3 py-1 text-[13px] font-bold",
              tab === id
                ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
                : "text-[var(--ink-soft)]",
            ].join(" ")}
            onClick={() =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (id === "students") next.delete("tab");
                else next.set("tab", id);
                return next;
              })
            }
          >
            {id === "students" ? "Students" : "Classes"}
          </button>
        ))}
      </div>

      {tab === "students" ? (
      <section>
        <label className="mb-3 flex max-w-xs flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Class</span>
          <Select
            value={classFilter}
            aria-label="Filter by class"
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option value="">All classes</option>
            {roster.classes.map((classGroup) => (
              <option key={classGroup.id} value={classGroup.id}>
                {classGroup.title}
              </option>
            ))}
          </Select>
        </label>
        {!roster.loading && visibleStudents.length === 0 && !roster.query && !classFilter ? (
          <p className="max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            No students yet. Add them here, or when you enroll someone in a course
            or class.
          </p>
        ) : (
          <StudentRosterList
            students={visibleStudents}
            orgSlug={roster.organization.slug}
            emptyMessage={
              classFilter ? "No students in that class." : "No students match that search."
            }
            classLabel={(id) => classNames.get(id)?.join(", ") ?? null}
            selectedIds={canAct ? roster.selectedIds : undefined}
            onToggle={canAct ? roster.onToggle : undefined}
            onSelectAll={
              canAct
                ? () => roster.onSelectIds(visibleStudents.map((student) => student.id))
                : undefined
            }
            onClearSelection={canAct ? roster.onClearSelection : undefined}
            trailing={
              canRemove
                ? (student) => (
                    <Button
                      variant="secondary"
                      onClick={() => setPendingRemove(student)}
                      disabled={roster.removingId === student.id}
                    >
                      {roster.removingId === student.id ? "Removing…" : "Remove"}
                    </Button>
                  )
                : undefined
            }
          />
        )}

        {canAct ? (
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
        ) : null}
      </section>
      ) : null}

      {canAct && roster.panelOpen ? (
        <section className="max-w-3xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
                Add students
              </h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                Name is enough. Student email, parent email, and grade are
                optional. A student email sends an invite when you add them.
                Paste several names at once when you’re adding a group.
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

      {tab === "classes" ? (
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
              Classes
            </h2>
          </div>
          {canAct && !roster.creatingClassOpen ? (
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
      ) : null}

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remove student?"
        body={
          pendingRemove
            ? `${pendingRemove.name} will leave the roster, including their classes and courses.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Keep them"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          const student = pendingRemove;
          setPendingRemove(null);
          roster.onRemove(student.id);
        }}
      />
    </div>
  );
}
