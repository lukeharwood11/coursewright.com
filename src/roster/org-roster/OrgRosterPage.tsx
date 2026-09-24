import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, UserPlusIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
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
import { Tab, TabList } from "@/ui/Tabs";
import { BatchCreateStudentsForm } from "@/roster/student-profile/components/BatchCreateStudentsForm";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { AddStudentsDrawer } from "./components/AddStudentsDrawer";
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

  function setTab(id: "students" | "classes") {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === "students") next.delete("tab");
      else next.set("tab", id);
      return next;
    });
  }

  return (
    <div className="space-y-5 px-5 py-4 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Students
        </h1>
        {canEditGradingScale(role) ? (
          <Link
            to={gradingSettingsPath(roster.organization.slug)}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--green)]"
          >
            <Cog6ToothIcon className="h-4 w-4" aria-hidden />
            Grading settings
          </Link>
        ) : null}
      </header>

      {roster.loading ? (
        <PageLoading embedded label="Loading roster…" />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-soft)] pb-3">
        <TabList label="Students sections">
          <Tab selected={tab === "students"} onSelect={() => setTab("students")}>
            Students
          </Tab>
          <Tab selected={tab === "classes"} onSelect={() => setTab("classes")}>
            Classes
          </Tab>
        </TabList>

        {tab === "students" && canAct ? (
          <Button type="button" onClick={roster.openPanel}>
            <UserPlusIcon className="h-5 w-5" aria-hidden />
            Add students
          </Button>
        ) : null}
        {tab === "classes" && canAct && !roster.creatingClassOpen ? (
          <Button type="button" onClick={roster.openCreateClass}>
            <PlusIcon className="h-5 w-5" aria-hidden />
            Create class
          </Button>
        ) : null}
      </div>

      {tab === "students" ? (
        <section className={roster.selectedIds.length > 0 ? "pb-24" : undefined}>
          <div className="flex flex-col gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-md">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                Find students
              </span>
              <Input
                className="w-full"
                value={roster.query}
                onChange={(event) => roster.setQuery(event.target.value)}
                placeholder="Search by name"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 sm:w-56">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                Class
              </span>
              <Select
                wrapperClassName="w-full"
                value={classFilter}
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
            <p
              className="shrink-0 text-[12.5px] font-bold text-[var(--ink-faint)] sm:ml-auto sm:py-[13px]"
              aria-live="polite"
            >
              {roster.loading
                ? "Loading…"
                : `${visibleStudents.length} ${
                    visibleStudents.length === 1 ? "student" : "students"
                  }`}
            </p>
          </div>

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

          {!roster.loading ? (
            visibleStudents.length === 0 && !roster.query && !classFilter ? (
              <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
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
                variant="directory"
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
            )
          ) : null}
        </section>
      ) : null}

      <AddStudentsDrawer
        open={canAct && roster.panelOpen}
        onClose={roster.closePanel}
      >
        <p className="mb-4 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          A student email sends an invite when you add them. Paste several names
          at once when you’re adding a group.
        </p>
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
      </AddStudentsDrawer>

      {tab === "classes" ? (
        <section>
          {roster.creatingClassOpen ? (
            <form
              className="flex max-w-xl flex-col gap-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3 sm:flex-row"
              onSubmit={roster.onCreateClass}
            >
              <Input
                className="min-w-0 flex-1"
                value={roster.classTitle}
                onChange={(event) => roster.setClassTitle(event.target.value)}
                placeholder="Wednesday cohort"
                aria-label="Class name"
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
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {roster.classes.map((classGroup) => (
                <li key={classGroup.id}>
                  <Link
                    to={`/my/${roster.organization.slug}/classes/${classGroup.id}`}
                    className="block h-full rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3 text-[15.5px] font-extrabold text-[var(--ink)] hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
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
