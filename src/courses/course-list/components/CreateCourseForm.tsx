import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { CourseIconPicker } from "@/courses/components/CourseIconPicker";
import type { CourseSummary } from "@/courses/databridge/courses";
import type { CourseIconValue } from "@/courses/model/courseIcon";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function CreateCourseForm({
  title,
  description,
  location,
  subject,
  iconKey,
  startDate,
  endDate,
  status,
  gradeLevels,
  gradeLabels,
  mode,
  sourceCourseId,
  sourceCourses,
  error,
  submitting,
  onTitleChange,
  onDescriptionChange,
  onLocationChange,
  onSubjectChange,
  onIconKeyChange,
  onStartDateChange,
  onEndDateChange,
  onStatusChange,
  onToggleGrade,
  onModeChange,
  onSourceChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  description: string;
  location: string;
  subject: string;
  iconKey: CourseIconValue;
  startDate: string;
  endDate: string;
  status: string;
  gradeLevels: string[];
  gradeLabels: string[];
  mode: "scratch" | "copy";
  sourceCourseId: number | null;
  sourceCourses: CourseSummary[];
  error: string | null;
  submitting: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onIconKeyChange: (value: CourseIconValue) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onToggleGrade: (label: string) => void;
  onModeChange: (mode: "scratch" | "copy") => void;
  onSourceChange: (id: number | null) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
    >
      <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Create course</h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        You can print what you make without adding students. Families won’t see
        a new course until you publish it.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <ModeButton
          selected={mode === "scratch"}
          onClick={() => onModeChange("scratch")}
        >
          From scratch
        </ModeButton>
        <ModeButton
          selected={mode === "copy"}
          onClick={() => onModeChange("copy")}
        >
          From another course
        </ModeButton>
      </div>

      {mode === "copy" ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Copy from
          </span>
          <select
            className={controlClass}
            value={sourceCourseId ?? ""}
            onChange={(event) =>
              onSourceChange(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Pick a course</option>
            {sourceCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-[var(--ink-faint)]">
            Copies the units and materials. Students are not copied. Families
            won’t see the new course until you publish it.
          </span>
        </label>
      ) : null}

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input
          className="w-full"
          required
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Description (optional)
        </span>
        <textarea
          className={`${controlClass} min-h-[4.5rem] resize-y`}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </label>

      <div className="mt-3">
        <CourseIconPicker value={iconKey} onChange={onIconKeyChange} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Subject (optional)
          </span>
          <Input
            className="w-full"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="Math, nature study…"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Location (optional)
          </span>
          <Input
            className="w-full"
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Room A, the park…"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Start date (optional)
          </span>
          <Input
            className="w-full"
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            End date (optional)
          </span>
          <Input
            className="w-full"
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Status</span>
        <select
          className={controlClass}
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-[12px] text-[var(--ink-faint)]">
          Active courses are in use this term. Families still only see a course
          after you publish it.
        </span>
      </label>

      {gradeLabels.length > 0 ? (
        <fieldset className="mt-3">
          <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
            Grade levels (optional)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {gradeLabels.map((label) => (
              <label
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--line-soft)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--ink-soft)]"
              >
                <input
                  type="checkbox"
                  checked={gradeLevels.includes(label)}
                  onChange={() => onToggleGrade(label)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? mode === "copy"
              ? "Copying…"
              : "Creating…"
            : mode === "copy"
              ? "Create from this course"
              : "Create course"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ModeButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-[12px] font-bold",
        selected
          ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
          : "bg-[var(--line-soft)] text-[var(--ink-soft)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
