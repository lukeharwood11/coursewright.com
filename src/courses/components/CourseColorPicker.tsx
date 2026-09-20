import {
  COURSE_COLOR_KEYS,
  courseColorCssVar,
  courseColorLabel,
  type CourseColorKey,
} from "@/courses/model/courseColor";

const tileClass = [
  "flex h-11 w-11 items-center justify-center rounded-[6px] border bg-[var(--surface)]",
  "hover:border-[var(--green)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
].join(" ");

export function CourseColorPicker({
  value,
  onChange,
}: {
  value: CourseColorKey;
  onChange: (next: CourseColorKey) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
        Calendar color
      </legend>
      <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
        Used on This week and Calendar. Selected: {courseColorLabel(value)}.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COURSE_COLOR_KEYS.map((key) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              className={`${tileClass} ${
                selected
                  ? "border-[var(--green)] bg-[var(--green-tint)]"
                  : "border-[var(--line)]"
              }`}
              onClick={() => onChange(key)}
              aria-pressed={selected}
              aria-label={courseColorLabel(key)}
              title={courseColorLabel(key)}
            >
              <span
                className="h-6 w-6 rounded-full"
                style={{ background: courseColorCssVar(key) }}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
