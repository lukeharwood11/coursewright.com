import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { AddStudentForm } from "@/roster/student-profile/components/AddStudentForm";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
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
        Student profiles for this organization. Group them into classes here.
        Course enrollments live on each course.
      </p>
      <p className="mt-2 text-[13px]">
        <Link
          to={`/my/${roster.organization.slug}/families`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Families
        </Link>
      </p>

      {roster.loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading roster…</p>
      ) : null}

      {roster.error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {roster.error}
        </p>
      ) : null}

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Add student</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Name is enough. Parent email and grade are optional.
          </p>
          <div className="mt-4">
            <AddStudentForm
              name={roster.name}
              parentEmail={roster.parentEmail}
              gradeLevel={roster.gradeLevel}
              gradeLabels={roster.gradeLabels}
              error={roster.studentError}
              saving={roster.addingStudent}
              submitLabel="Add student"
              onNameChange={roster.setName}
              onParentEmailChange={roster.setParentEmail}
              onGradeLevelChange={roster.setGradeLevel}
              onSubmit={roster.onAddStudent}
            />
          </div>
        </section>

        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Classes</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Named groups of students — not a course, and no materials.
          </p>
          <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={roster.onCreateClass}>
            <Input
              className="min-w-0 flex-1"
              value={roster.classTitle}
              onChange={(event) => roster.setClassTitle(event.target.value)}
              placeholder="Wednesday cohort"
              disabled={roster.creatingClass}
            />
            <Button type="submit" disabled={roster.creatingClass}>
              <PlusIcon className="h-5 w-5" aria-hidden />
              {roster.creatingClass ? "Creating…" : "Create class"}
            </Button>
          </form>
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

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            className="text-[15.5px] font-extrabold text-[var(--ink)]"
          >
            Students
          </h2>
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
        </div>
        {!roster.loading && roster.students.length === 0 && !roster.query ? (
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            No student profiles yet. Add a student here, or when you enroll
            someone in a course or class. You can still print courses without a
            roster.
          </p>
        ) : (
          <StudentRosterList
            students={roster.students}
            orgSlug={roster.organization.slug}
            emptyMessage="No students match that search."
          />
        )}
      </section>
    </div>
  );
}
