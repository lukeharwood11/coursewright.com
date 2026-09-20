import { ButtonLink } from "@/ui/Button";
import { UserCard } from "@/organizations/user-card/UserCard";
import { Avatar } from "@/ui/Avatar";
import { courseRosterPath } from "@/courses/model/paths";
import type { CourseInstructor } from "@/courses/databridge/courses";
import type { CourseEnrollment } from "@/roster/databridge/enrollments";

export function CourseSidebar({
  orgSlug,
  courseId,
  instructors,
  students,
  canEdit,
}: {
  orgSlug: string;
  courseId: number;
  instructors: CourseInstructor[];
  students: CourseEnrollment[];
  canEdit: boolean;
}) {
  return (
    <aside className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Teachers</h2>
      {instructors.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
          No teachers listed yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {instructors.map((person) => (
            <li key={person.userId}>
              <UserCard
                orgSlug={orgSlug}
                userId={person.userId}
                name={person.name}
                compact
              />
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-5 text-[13px] font-bold text-[var(--ink-soft)]">Students</h2>
      {students.length === 0 ? (
        <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
          No students enrolled yet.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {students.map((enrollment) => (
            <li key={enrollment.student.id} className="flex items-center gap-2">
              <Avatar name={enrollment.student.name} size={28} />
              <span className="min-w-0 truncate text-[13.5px] font-semibold text-[var(--ink)]">
                {enrollment.student.name}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <div className="mt-4">
          <ButtonLink
            variant="secondary"
            to={courseRosterPath(orgSlug, courseId)}
            fullWidth
          >
            Course roster
          </ButtonLink>
        </div>
      ) : null}
    </aside>
  );
}
