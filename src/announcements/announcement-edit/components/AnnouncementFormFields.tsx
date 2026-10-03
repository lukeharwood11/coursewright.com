import {
  BookOpenIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import {
  ResponsiveSegmentPicker,
  type ResponsiveSegmentOption,
} from "@/ui/ResponsiveSegmentPicker";
import {
  announcementAudienceLabel,
  announcementAudienceVisibilityHint,
  announcementAudienceVisibilityHintLabel,
  type AnnouncementAudience,
} from "@/announcements/model/audience";
import { WhoCanSeeHint } from "@/ui/WhoCanSeeHint";
import type { CourseSummary } from "@/courses/databridge/courses";
import type { ClassSummary } from "@/roster/databridge/classes";
import type { StudentSummary } from "@/roster/databridge/students";
import { SelectStudentsModal } from "./SelectStudentsModal";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

const audienceOptions: ResponsiveSegmentOption<AnnouncementAudience>[] = [
  { value: "course", label: announcementAudienceLabel("course"), icon: BookOpenIcon },
  { value: "class", label: announcementAudienceLabel("class"), icon: UserGroupIcon },
  { value: "student", label: announcementAudienceLabel("student"), icon: UserIcon },
  {
    value: "instructors",
    label: announcementAudienceLabel("instructors"),
    icon: AcademicCapIcon,
  },
];

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
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const studentsById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );
  const selectedStudents = useMemo(
    () =>
      studentIds
        .map((id) => studentsById.get(id))
        .filter((student): student is StudentSummary => student != null),
    [studentIds, studentsById],
  );

  return (
    <>
      <fieldset>
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
          Who is this for?
        </legend>
        <ResponsiveSegmentPicker
          ariaLabel="Announcement audience"
          value={audience}
          onChange={onAudience}
          options={audienceOptions}
          disabled={!isNew}
        />
        {audience != null ? (
          <WhoCanSeeHint hintLabel={announcementAudienceVisibilityHintLabel(audience)}>
            {announcementAudienceVisibilityHint(audience)}
          </WhoCanSeeHint>
        ) : null}
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
        <fieldset className="mt-4">
          <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
            Students
          </legend>
          {students.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
              Nothing to choose yet.
            </p>
          ) : (
            <>
              {selectedStudents.length > 0 ? (
                <ul className="mt-2 flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                  {selectedStudents.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between gap-2 rounded-[6px] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1.5"
                    >
                      <span className="min-w-0 text-[13px] font-semibold text-[var(--ink)]">
                        {student.name}
                      </span>
                      {isNew ? (
                        <button
                          type="button"
                          className="shrink-0 rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                          aria-label={`Remove ${student.name}`}
                          onClick={() => onToggleStudentId(student.id)}
                        >
                          <XMarkIcon className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
                  Choose at least one student.
                </p>
              )}
              {isNew ? (
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className="mt-2"
                  onClick={() => setStudentsModalOpen(true)}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden />
                  {selectedStudents.length === 0
                    ? "Choose students"
                    : "Change selection"}
                </Button>
              ) : null}
            </>
          )}
          <SelectStudentsModal
            open={studentsModalOpen}
            students={students}
            selectedIds={studentIds}
            onToggle={onToggleStudentId}
            onClose={() => setStudentsModalOpen(false)}
          />
        </fieldset>
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
          placeholder="A short note students will see on home."
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1">
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
        <label className="flex min-w-0 flex-col gap-1">
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
        {audience === "instructors"
          ? "Leave dates blank to keep this on the staff list until you remove it."
          : "Leave dates blank to show this on home until you remove it. If you set dates, students only see it between them."}
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
            {audience === "instructors"
              ? "Email collaborators who already have an account, and show it in their Activity."
              : "Email students who already have an account, and show it in their Activity."}
          </span>
        </span>
      </label>
    </>
  );
}
