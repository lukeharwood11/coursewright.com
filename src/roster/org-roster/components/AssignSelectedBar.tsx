import { Button } from "@/ui/Button";

const selectClass = [
  "min-w-0 flex-1 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export type DestinationOption = {
  id: number;
  title: string;
};

export function AssignSelectedBar({
  selectedCount,
  classes,
  courses,
  classId,
  courseId,
  saving,
  error,
  onClassIdChange,
  onCourseIdChange,
  onAddToClass,
  onEnrollInCourse,
  onClear,
}: {
  selectedCount: number;
  classes: DestinationOption[];
  courses: DestinationOption[];
  classId: string;
  courseId: string;
  saving: boolean;
  error: string | null;
  onClassIdChange: (value: string) => void;
  onCourseIdChange: (value: string) => void;
  onAddToClass: () => void;
  onEnrollInCourse: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <section className="mt-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--green-tint)] p-3">
      <div className="grid gap-3 xl:grid-cols-[auto_minmax(15rem,1fr)_minmax(15rem,1fr)] xl:items-end">
        <div className="flex min-h-10 items-center justify-between gap-4 xl:min-w-40">
          <p className="text-[14px] font-extrabold text-[var(--ink)]">
            {selectedCount === 1
              ? "1 student selected"
              : `${selectedCount} students selected`}
          </p>
          <button
            type="button"
            className="text-[13px] font-bold text-[var(--green-deep)] hover:text-[var(--green)] disabled:opacity-60"
            disabled={saving}
            onClick={onClear}
          >
            Clear
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Add to class
            </span>
            <select
              className={selectClass}
              value={classId}
              onChange={(event) => onClassIdChange(event.target.value)}
              disabled={saving || classes.length === 0}
            >
              <option value="">
                {classes.length === 0 ? "No classes yet" : "Choose a class"}
              </option>
              {classes.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            disabled={saving || !classId}
            onClick={onAddToClass}
          >
            {saving ? "Saving…" : "Add"}
          </Button>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Enroll in course
            </span>
            <select
              className={selectClass}
              value={courseId}
              onChange={(event) => onCourseIdChange(event.target.value)}
              disabled={saving || courses.length === 0}
            >
              <option value="">
                {courses.length === 0 ? "No courses yet" : "Choose a course"}
              </option>
              {courses.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            disabled={saving || !courseId}
            onClick={onEnrollInCourse}
          >
            {saving ? "Saving…" : "Enroll"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
