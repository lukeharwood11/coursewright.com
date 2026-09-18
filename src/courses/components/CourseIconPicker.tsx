import { XMarkIcon } from "@heroicons/react/24/outline";
import { CourseIcon } from "@/courses/components/CourseIcon";
import {
  COURSE_ICON_OPTIONS,
  courseIconLabel,
  type CourseIconValue,
} from "@/courses/model/courseIcon";

const tileClass = [
  "flex h-11 w-11 items-center justify-center rounded-[6px] border bg-[var(--surface)]",
  "text-[var(--green)] hover:border-[var(--green)] hover:bg-[var(--green-tint)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "motion-reduce:transition-none",
].join(" ");

export function CourseIconPicker({
  value,
  onChange,
}: {
  value: CourseIconValue;
  onChange: (next: CourseIconValue) => void;
}) {
  const selectedLabel = courseIconLabel(value);

  return (
    <fieldset>
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">Icon</legend>
      <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
        Optional. Shows next to this course in your course list.
        {selectedLabel ? ` Selected: ${selectedLabel}.` : " None selected."}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className={`${tileClass} ${
            value === null
              ? "border-[var(--green)] bg-[var(--green-tint)]"
              : "border-[var(--line)]"
          }`}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          aria-label="No icon"
          title="No icon"
        >
          <XMarkIcon className="h-5 w-5 text-[var(--ink-faint)]" aria-hidden />
        </button>
        {COURSE_ICON_OPTIONS.map((option) => {
          const selected = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              className={`${tileClass} ${
                selected
                  ? "border-[var(--green)] bg-[var(--green-tint)]"
                  : "border-[var(--line)]"
              }`}
              onClick={() => onChange(option.key)}
              aria-pressed={selected}
              aria-label={option.label}
              title={option.label}
            >
              <CourseIcon iconKey={option.key} className="h-6 w-6" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
