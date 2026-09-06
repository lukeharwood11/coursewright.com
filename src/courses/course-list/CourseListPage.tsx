import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { toastNotImplemented } from "@/ui/toast";
import { useCourseList } from "./hooks/useCourseList";

export function CourseListPage() {
  const { organization, courses, loading, error } = useCourseList();

  useEffect(() => {
    document.title = `Courses · ${organization.name} · Course Wright`;
  }, [organization.name]);

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Courses
          </h1>
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            Offerings families participate in. You can create a course and print
            without a roster.
          </p>
        </div>
        <Button onClick={() => toastNotImplemented("Create course")}>
          <PlusIcon className="h-5 w-5" aria-hidden />
          Create course
        </Button>
      </div>

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading courses…</p>
      ) : null}

      {error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && courses.length === 0 ? (
        <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          No courses yet. Create one from scratch or from a template when you’re
          ready.
        </p>
      ) : null}

      {courses.length > 0 ? (
        <ul className="mt-6 divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                to={`/my/${organization.slug}/courses/${course.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
              >
                <span className="min-w-0 flex-1 truncate text-[15.5px] font-extrabold text-[var(--ink)]">
                  {course.title}
                </span>
                <Badge variant={course.status === "active" ? "green" : "neutral"}>
                  {course.status === "active" ? "Active" : course.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
