import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
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

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const audienceOptions: Array<{
  value: AnnouncementAudience;
  Icon: IconComponent;
}> = [
  { value: "course", Icon: BookOpenIcon },
  { value: "class", Icon: UserGroupIcon },
  { value: "student", Icon: UserIcon },
];

const segmentIdle =
  "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-[9px] text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[var(--ink-soft)]";

const segmentActive =
  "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-[9px] text-[13px] font-bold bg-[var(--green-tint)] text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] disabled:cursor-not-allowed disabled:opacity-60";

const segmentGroupClass =
  "mt-2 flex w-full overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]";

function TargetChecklist({
  label,
  emptyHint,
  options,
  selectedIds,
  disabled,
  onToggle,
}: {
  label: string;
  emptyHint?: string;
  options: Array<{ id: number; name: string }>;
  selectedIds: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
}) {
  const selected = new Set(selectedIds);
  return (
    <fieldset className="mt-4">
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
          {emptyHint ?? "Nothing to choose yet."}
        </p>
      ) : (
        <ul className="mt-2 max-h-56 divide-y divide-[var(--line-soft)] overflow-y-auto rounded-[6px] border border-[var(--line)]">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[var(--green)]"
                  checked={selected.has(option.id)}
                  disabled={disabled}
                  onChange={() => onToggle(option.id)}
                />
                <span className="text-[14px] font-semibold text-[var(--ink)]">
                  {option.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function AnnouncementFormFields({
  isNew,
  audience,
  courseIds,
  classIds,
  studentIds,
  title,
  body,
  startDate,
  endDate,
  courses,
  classes,
  students,
  onAudience,
  onToggleCourseId,
  onToggleClassId,
  onToggleStudentId,
  onTitle,
  onBody,
  onStartDate,
  onEndDate,
  sendNotification,
  onSendNotification,
}: {
  isNew: boolean;
  audience: AnnouncementAudience | null;
  courseIds: number[];
  classIds: number[];
  studentIds: number[];
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  sendNotification: boolean;
  courses: CourseSummary[];
  classes: ClassSummary[];
  students: StudentSummary[];
  onAudience: (value: AnnouncementAudience) => void;
  onToggleCourseId: (id: number) => void;
  onToggleClassId: (id: number) => void;
  onToggleStudentId: (id: number) => void;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
  onSendNotification: (value: boolean) => void;
}) {
  return (
    <>
      <fieldset>
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
          Who is this for?
        </legend>
        <div
          className={segmentGroupClass}
          role="group"
          aria-label="Announcement audience"
        >
          {audienceOptions.map(({ value, Icon }, index) => {
            const active = audience === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                disabled={!isNew}
                className={`${active ? segmentActive : segmentIdle}${
                  index < audienceOptions.length - 1
                    ? " border-r border-[var(--line)]"
                    : ""
                }`}
                onClick={() => onAudience(value)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {announcementAudienceLabel(value)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {audience === "course" ? (
        <TargetChecklist
          label="Courses"
          emptyHint="You can announce to a course you teach."
          options={courses.map((course) => ({
            id: course.id,
            name: course.title,
          }))}
          selectedIds={courseIds}
          disabled={!isNew}
          onToggle={onToggleCourseId}
        />
      ) : null}

      {audience === "class" ? (
        <TargetChecklist
          label="Classes"
          options={classes.map((classGroup) => ({
            id: classGroup.id,
            name: classGroup.title,
          }))}
          selectedIds={classIds}
          disabled={!isNew}
          onToggle={onToggleClassId}
        />
      ) : null}

      {audience === "student" ? (
        <TargetChecklist
          label="Students"
          options={students.map((student) => ({
            id: student.id,
            name: student.name,
          }))}
          selectedIds={studentIds}
          disabled={!isNew}
          onToggle={onToggleStudentId}
        />
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
      <label className="mt-5 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
          checked={sendNotification}
          onChange={() => onSendNotification(!sendNotification)}
        />
        <span>
          <span className="block text-[14px] font-semibold text-[var(--ink)]">
            Send notification
          </span>
          <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
            Email families who already have an account for this notice.
          </span>
        </span>
      </label>
    </>
  );
}
