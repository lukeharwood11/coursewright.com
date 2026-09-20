import { courseColorCssVar } from "@/courses/model/courseColor";
import type { CalendarCourse } from "@/calendar/model/events";

export function CourseLegend({
  courses,
  hiddenCourseIds,
  onToggle,
}: {
  courses: CalendarCourse[];
  hiddenCourseIds: Set<number>;
  onToggle: (courseId: number) => void;
}) {
  if (courses.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {courses.map((course) => {
        const hidden = hiddenCourseIds.has(course.id);
        return (
          <button
            key={course.id}
            type="button"
            onClick={() => onToggle(course.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold ${
              hidden
                ? "border-[var(--line)] text-[var(--ink-faint)]"
                : "border-[var(--line)] text-[var(--ink)]"
            }`}
            aria-pressed={!hidden}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: hidden ? "transparent" : courseColorCssVar(course.colorKey),
                border: `2px solid ${courseColorCssVar(course.colorKey)}`,
              }}
              aria-hidden
            />
            {course.title}
          </button>
        );
      })}
    </div>
  );
}
