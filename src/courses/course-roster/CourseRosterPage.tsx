import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { coursePath } from "@/courses/model/paths";
import { useCourseRoster } from "./hooks/useCourseRoster";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function CourseRosterPage() {
  const roster = useCourseRoster();

  useEffect(() => {
    document.title = roster.course
      ? `${roster.course.title} roster · Course Wright`
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
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          This roster isn’t available.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Course roster
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{roster.course.title}</p>
      <p className="mt-3 text-[13px]">
        <Link
          to={coursePath(roster.organization.slug, roster.course.id)}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to course
        </Link>
      </p>
      <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        Students are optional. You can print materials without anyone on this
        list.
      </p>

      {roster.enrollments.length === 0 ? (
        <p className="mt-4 text-[13.5px] text-[var(--ink-faint)]">No students yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {roster.enrollments.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <span>
                <span className="block text-[15px] font-extrabold text-[var(--ink)]">
                  {row.name}
                </span>
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  {row.parentEmail ?? "No parent email"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {row.gradeLevel ? <Badge variant="neutral">{row.gradeLevel}</Badge> : null}
                <Badge variant={row.status === "active" ? "green" : "neutral"}>
                  {row.status}
                </Badge>
                {row.status === "active" ? (
                  <Button
                    variant="secondary"
                    className="px-2.5 py-1.5 text-[12px]"
                    onClick={() => roster.unenroll.mutate(row.id)}
                  >
                    Unenroll
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
        onSubmit={roster.onSubmit}
      >
        <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Add student</h2>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
          <Input
            className="w-full"
            required
            value={roster.name}
            onChange={(event) => roster.setName(event.target.value)}
          />
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Parent email (optional)
          </span>
          <Input
            className="w-full"
            type="email"
            value={roster.parentEmail}
            onChange={(event) => roster.setParentEmail(event.target.value)}
          />
        </label>
        {roster.gradeLabels.length > 0 ? (
          <label className="mt-3 flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Grade (optional)
            </span>
            <select
              className={controlClass}
              value={roster.gradeLevel}
              onChange={(event) => roster.setGradeLevel(event.target.value)}
            >
              <option value="">None</option>
              {roster.gradeLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {roster.addError ? (
          <p className="mt-3 text-[13px] text-[var(--amber-deep)]">{roster.addError}</p>
        ) : null}
        <div className="mt-4">
          <Button type="submit" disabled={roster.adding}>
            {roster.adding ? "Adding…" : "Add student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
