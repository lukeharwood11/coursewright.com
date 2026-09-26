import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import {
  discussionAudienceLabel,
  discussionFamilyAudienceLabel,
  DISCUSSION_FAMILY_AUDIENCES,
  type DiscussionAudience,
  type DiscussionFamilyAudience,
} from "@/discussions/model/audience";
import type { CourseSummary } from "@/courses/databridge/courses";
import type { ClassSummary } from "@/roster/databridge/classes";

const segmentIdle =
  "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-[9px] text-[13px] font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)] motion-reduce:transition-none";

const segmentActive =
  "inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-[9px] text-[13px] font-bold bg-[var(--green-tint)] text-[var(--green-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--green)]";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

function audienceOptionsFor(showOrganization: boolean): Array<{
  value: DiscussionAudience;
  Icon: IconComponent;
}> {
  const options: Array<{ value: DiscussionAudience; Icon: IconComponent }> = [
    { value: "course", Icon: BookOpenIcon },
    { value: "class", Icon: UserGroupIcon },
  ];
  if (showOrganization) {
    options.push({ value: "organization", Icon: BuildingOffice2Icon });
  }
  return options;
}

export function DiscussionNewFormFields({
  audience,
  familyAudience,
  courseId,
  classId,
  title,
  courses,
  classes,
  courseEmptyHint,
  classEmptyHint,
  showOrganization,
  showFamilyAudience,
  onAudience,
  onFamilyAudience,
  onCourseId,
  onClassId,
  onTitle,
  showNotifyAll,
  notifyAll,
  onNotifyAll,
}: {
  audience: DiscussionAudience | null;
  familyAudience: DiscussionFamilyAudience;
  courseId: number | null;
  classId: number | null;
  title: string;
  courses: CourseSummary[];
  classes: ClassSummary[];
  courseEmptyHint: string;
  classEmptyHint: string;
  showOrganization: boolean;
  showFamilyAudience: boolean;
  onAudience: (value: DiscussionAudience) => void;
  onFamilyAudience: (value: DiscussionFamilyAudience) => void;
  onCourseId: (value: number | null) => void;
  onClassId: (value: number | null) => void;
  onTitle: (value: string) => void;
  showNotifyAll?: boolean;
  notifyAll?: boolean;
  onNotifyAll?: (value: boolean) => void;
}) {
  const audienceOptions = audienceOptionsFor(showOrganization);
  return (
    <>
      <fieldset>
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
          Who is this for?
        </legend>
        <div
          className="mt-2 flex w-full overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]"
          role="group"
          aria-label="Discussion audience"
        >
          {audienceOptions.map(({ value, Icon }, index) => {
            const active = audience === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                className={`${active ? segmentActive : segmentIdle}${
                  index < audienceOptions.length - 1
                    ? " border-r border-[var(--line)]"
                    : ""
                }`}
                onClick={() => onAudience(value)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {discussionAudienceLabel(value)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {showFamilyAudience && audience != null ? (
        <fieldset className="mt-4">
          <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
            Who in families can see this?
          </legend>
          <div
            className="mt-2 flex w-full overflow-hidden rounded-[6px] border border-[var(--line)] bg-[var(--surface)]"
            role="group"
            aria-label="Family audience"
          >
            {DISCUSSION_FAMILY_AUDIENCES.map((value, index) => {
              const active = familyAudience === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  className={`${active ? segmentActive : segmentIdle}${
                    index < DISCUSSION_FAMILY_AUDIENCES.length - 1
                      ? " border-r border-[var(--line)]"
                      : ""
                  }`}
                  onClick={() => onFamilyAudience(value)}
                >
                  {discussionFamilyAudienceLabel(value)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[12.5px] text-[var(--ink-faint)]">
            Staff can always see and post. Choose parents only to keep student
            accounts out of the thread.
          </p>
        </fieldset>
      ) : null}

      {audience === "course" ? (
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Course
          </span>
          {courses.length === 0 ? (
            <p className="text-[12.5px] text-[var(--ink-faint)]">
              {courseEmptyHint}
            </p>
          ) : (
            <Select
              wrapperClassName="w-full"
              value={courseId == null ? "" : String(courseId)}
              onChange={(event) =>
                onCourseId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
          )}
        </label>
      ) : null}

      {audience === "class" ? (
        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Class
          </span>
          {classes.length === 0 ? (
            <p className="text-[12.5px] text-[var(--ink-faint)]">
              {classEmptyHint}
            </p>
          ) : (
            <Select
              wrapperClassName="w-full"
              value={classId == null ? "" : String(classId)}
              onChange={(event) =>
                onClassId(
                  event.target.value ? Number(event.target.value) : null,
                )
              }
            >
              <option value="">Choose a class</option>
              {classes.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.title}
                </option>
              ))}
            </Select>
          )}
        </label>
      ) : null}

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input
          className="w-full"
          required
          value={title}
          onChange={(event) => onTitle(event.target.value)}
          placeholder="Question about this week"
        />
      </label>

      {showNotifyAll ? (
        <label className="mt-5 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
            checked={notifyAll === true}
            onChange={() => onNotifyAll?.(!(notifyAll === true))}
          />
          <span>
            <span className="block text-[14px] font-semibold text-[var(--ink)]">
              Notify everyone
            </span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--ink-faint)]">
              Also send this first post to everyone who can see the discussion.
              Course instructors, class leads, or org staff are notified either way.
            </span>
          </span>
        </label>
      ) : null}
    </>
  );
}
