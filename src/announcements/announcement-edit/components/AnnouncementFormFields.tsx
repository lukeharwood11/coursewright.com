import { Input } from "@/ui/Input";
import {
  announcementAudienceLabel,
  type AnnouncementAudience,
} from "@/announcements/model/audience";
import type { CourseSummary } from "@/courses/databridge/courses";
import type { ClassSummary } from "@/roster/databridge/classes";
import type { StudentSummary } from "@/roster/databridge/students";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function AnnouncementFormFields({
  isNew,
  audience,
  courseId,
  classId,
  studentId,
  title,
  body,
  startDate,
  endDate,
  courses,
  classes,
  students,
  onAudience,
  onCourseId,
  onClassId,
  onStudentId,
  onTitle,
  onBody,
  onStartDate,
  onEndDate,
}: {
  isNew: boolean;
  audience: AnnouncementAudience | null;
  courseId: number | null;
  classId: number | null;
  studentId: number | null;
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  courses: CourseSummary[];
  classes: ClassSummary[];
  students: StudentSummary[];
  onAudience: (value: AnnouncementAudience) => void;
  onCourseId: (value: number | null) => void;
  onClassId: (value: number | null) => void;
  onStudentId: (value: number | null) => void;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
}) {
  return (
    <>
      <fieldset>
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
          Who is this for?
        </legend>
        <div className="mt-2 flex flex-col gap-1.5">
          {(["course", "class", "student"] as const).map((value) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="announcement-audience"
                checked={audience === value}
                disabled={!isNew}
                onChange={() => onAudience(value)}
              />
              <span className="text-[14px] font-semibold text-[var(--ink)]">
                {announcementAudienceLabel(value)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {audience === "course" ? (
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Course</span>
          <select
            className={controlClass}
            value={courseId ?? ""}
            disabled={!isNew}
            onChange={(event) =>
              onCourseId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {isNew && courses.length === 0 ? (
            <span className="text-[12.5px] text-[var(--ink-faint)]">
              You can announce to a course you teach.
            </span>
          ) : null}
        </label>
      ) : null}

      {audience === "class" ? (
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Class</span>
          <select
            className={controlClass}
            value={classId ?? ""}
            disabled={!isNew}
            onChange={(event) =>
              onClassId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Choose a class</option>
            {classes.map((classGroup) => (
              <option key={classGroup.id} value={classGroup.id}>
                {classGroup.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {audience === "student" ? (
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Student</span>
          <select
            className={controlClass}
            value={studentId ?? ""}
            disabled={!isNew}
            onChange={(event) =>
              onStudentId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input
          className="w-full"
          required
          value={title}
          onChange={(event) => onTitle(event.target.value)}
          placeholder="Snow day tomorrow"
        />
      </label>
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Note (optional)</span>
        <textarea
          className={`${controlClass} min-h-[6rem] resize-y`}
          value={body}
          onChange={(event) => onBody(event.target.value)}
          placeholder="A short note families will see on home."
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Start date (optional)
          </span>
          <Input
            className="w-full"
            type="date"
            value={startDate}
            onChange={(event) => onStartDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            End date (optional)
          </span>
          <Input
            className="w-full"
            type="date"
            value={endDate}
            onChange={(event) => onEndDate(event.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
        Leave dates blank to show this on home until you remove it. If you set
        dates, families only see it between them.
      </p>
    </>
  );
}
