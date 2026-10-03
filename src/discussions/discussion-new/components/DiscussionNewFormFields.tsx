import {
  BookOpenIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import {
  ResponsiveSegmentPicker,
  type ResponsiveSegmentOption,
} from "@/ui/ResponsiveSegmentPicker";
import {
  discussionAudienceLabel,
  discussionAudienceVisibilityHint,
  discussionAudienceVisibilityHintLabel,
  discussionFamilyAudienceLabel,
  discussionFamilyAudienceVisibilityHint,
  discussionFamilyAudienceVisibilityHintLabel,
  DISCUSSION_FAMILY_AUDIENCES,
  type DiscussionAudience,
  type DiscussionFamilyAudience,
} from "@/discussions/model/audience";
import { WhoCanSeeHint } from "@/ui/WhoCanSeeHint";
import type { CourseSummary } from "@/courses/databridge/courses";
import type { ClassSummary } from "@/roster/databridge/classes";

function audienceOptionsFor(showStaffAudiences: boolean): Array<
  ResponsiveSegmentOption<DiscussionAudience>
> {
  const options: Array<ResponsiveSegmentOption<DiscussionAudience>> = [
    { value: "course", label: discussionAudienceLabel("course"), icon: BookOpenIcon },
    { value: "class", label: discussionAudienceLabel("class"), icon: UserGroupIcon },
  ];
  if (showStaffAudiences) {
    options.push({
      value: "organization",
      label: discussionAudienceLabel("organization"),
      icon: BuildingOffice2Icon,
    });
    options.push({
      value: "instructors",
      label: discussionAudienceLabel("instructors"),
      icon: AcademicCapIcon,
    });
  }
  return options;
}

const familyAudienceOptions: ResponsiveSegmentOption<DiscussionFamilyAudience>[] =
  DISCUSSION_FAMILY_AUDIENCES.map((value) => ({
    value,
    label: discussionFamilyAudienceLabel(value),
  }));

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
        <ResponsiveSegmentPicker
          ariaLabel="Discussion audience"
          value={audience}
          onChange={onAudience}
          options={audienceOptions}
        />
        {audience != null ? (
          <WhoCanSeeHint hintLabel={discussionAudienceVisibilityHintLabel(audience)}>
            {discussionAudienceVisibilityHint(audience)}
          </WhoCanSeeHint>
        ) : null}
      </fieldset>

      {showFamilyAudience && audience != null && audience !== "instructors" ? (
        <fieldset className="mt-4">
          <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
            Who in families can see this?
          </legend>
          <ResponsiveSegmentPicker
            ariaLabel="Family audience"
            value={familyAudience}
            onChange={onFamilyAudience}
            options={familyAudienceOptions}
          />
          <WhoCanSeeHint
            hintLabel={discussionFamilyAudienceVisibilityHintLabel(familyAudience)}
          >
            {discussionFamilyAudienceVisibilityHint(familyAudience)}
          </WhoCanSeeHint>
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
