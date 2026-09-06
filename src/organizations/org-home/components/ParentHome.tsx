import { Link } from "react-router-dom";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/ui/Avatar";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { toastNotImplemented } from "@/ui/toast";
import type { ParentDashboard } from "@/parent/model/dashboard";
import { formatMaterialDate } from "@/parent/model/thisWeek";

export function ParentHome({
  firstName,
  orgSlug,
  dashboard,
  loading,
  error,
}: {
  firstName: string;
  orgSlug: string;
  dashboard: ParentDashboard | null;
  loading: boolean;
  error: string | null;
}) {
  const weekLabel = dashboard?.week.label ?? "This week";

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-6 md:px-8 md:pb-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-[21px] font-semibold text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-soft)]">{weekLabel}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => toastNotImplemented("Print this week")}
        >
          <PrinterIcon className="h-5 w-5" aria-hidden />
          Print this week
        </Button>
      </div>

      <p className="mt-2 text-[13px]">
        <Link
          to="/my"
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Switch organization
        </Link>
        <span className="text-[var(--ink-faint)]"> · /my/{orgSlug}</span>
      </p>

      {loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading this week…</p>
      ) : null}

      {error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      {dashboard && !loading ? <ParentDashboardBody dashboard={dashboard} /> : null}

      <nav
        className="cw-org-chrome fixed inset-x-0 bottom-0 border-t border-[var(--line-soft)] bg-[var(--surface)] md:hidden"
        aria-label="Parent"
      >
        <div className="mx-auto grid max-w-lg grid-cols-2">
          <span className="py-3 text-center text-[11.5px] font-bold text-[var(--green)]">
            This week
          </span>
          <button
            type="button"
            className="py-3 text-center text-[11.5px] font-bold text-[var(--ink-faint)]"
            onClick={() => toastNotImplemented("Progress")}
          >
            Progress
          </button>
        </div>
      </nav>
    </div>
  );
}

function ParentDashboardBody({ dashboard }: { dashboard: ParentDashboard }) {
  if (!dashboard.hasActiveEnrollment) {
    return (
      <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
        You’re not on a course yet. When your co-op adds you, this week’s
        materials will show up here.
      </p>
    );
  }

  const datedCount = dashboard.students.reduce(
    (count, student) =>
      count +
      student.courses.reduce((inner, course) => inner + course.materials.length, 0),
    0,
  );

  return (
    <div className="mt-6 flex flex-col gap-5">
      {dashboard.importantNow.length > 0 ? (
        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--amber-tint)] p-4 [border-left-width:4px] [border-left-color:var(--amber)]">
          <h2 className="text-[12px] font-extrabold text-[var(--amber-deep)]">
            Important now
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {dashboard.importantNow.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toastNotImplemented("Open material")}
                  className="w-full rounded-[6px] bg-[var(--surface)] px-3 py-2 text-left"
                >
                  <span className="block text-[14px] font-bold text-[var(--ink)]">
                    {item.materialTitle}
                  </span>
                  <span className="text-[12.5px] text-[var(--ink-soft)]">
                    {item.courseTitle}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {datedCount === 0 ? (
        <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Nothing dated for this week. Check back soon, or print a material from
          a course when it’s ready.
        </p>
      ) : null}

      {dashboard.students.map((student) => (
        <section key={student.id}>
          <div className="mb-2 flex items-center gap-2">
            <Avatar name={student.name} size={30} />
            <p className="text-[15.5px] font-extrabold text-[var(--ink)]">
              {student.name}
            </p>
            {student.gradeLevel ? (
              <Badge variant="neutral">{student.gradeLevel}</Badge>
            ) : null}
          </div>

          {!student.hasActiveEnrollment ? (
            <p className="text-[13.5px] text-[var(--ink-soft)]">
              Not in an active course yet.
            </p>
          ) : null}

          {student.courses.map((course) => (
            <div
              key={course.id}
              className="mb-2 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
            >
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-[15.5px] font-extrabold text-[var(--ink)]"
                onClick={() => toastNotImplemented("Open course")}
              >
                {course.title}
              </button>
              {course.materials.length === 0 ? (
                <p className="border-t border-[var(--line-soft)] px-4 py-3 text-[13.5px] text-[var(--ink-faint)]">
                  No dated materials this week.
                </p>
              ) : (
                <ul>
                  {course.materials.map((material) => (
                    <li
                      key={material.id}
                      className="flex items-center gap-2 border-t border-[var(--line-soft)] px-4 py-2.5"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => toastNotImplemented("Open material")}
                      >
                        <span className="block truncate text-[14px] font-semibold text-[var(--ink)]">
                          {material.title}
                        </span>
                        {material.scheduledDate ? (
                          <span className="text-[12px] font-bold text-[var(--amber-deep)]">
                            {formatMaterialDate(material.scheduledDate)}
                          </span>
                        ) : null}
                      </button>
                      <Button
                        variant="secondary"
                        className="shrink-0 px-2.5 py-1.5 text-[12px]"
                        onClick={() => toastNotImplemented("Print")}
                      >
                        <PrinterIcon className="h-4 w-4" aria-hidden />
                        Print
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
