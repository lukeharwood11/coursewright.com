import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/ui/Input";
import { PageFormActions } from "@/ui/PageFormActions";
import { coursePath } from "@/courses/model/paths";
import { InstructorsSection } from "@/courses/instructors/InstructorsSection";
import { CourseIconPicker } from "@/courses/components/CourseIconPicker";
import { CourseColorPicker } from "@/courses/components/CourseColorPicker";
import {
  COURSE_SETTINGS_FORM_ID,
  useCourseSettings,
} from "./hooks/useCourseSettings";
import {
  CourseUnpublishControl,
  CourseVisibilityBanner,
} from "@/courses/course/components/CourseVisibilityBanner";
import { PublishedBadge } from "@/ui/PublishedBadge";
import { Badge } from "@/ui/Badge";
import { isCoursePublished } from "@/courses/model/visibility";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function CourseSettingsPage() {
  const settings = useCourseSettings();

  useEffect(() => {
    document.title = settings.course
      ? `${settings.course.title} settings · Course Wright`
      : "Course settings · Course Wright";
  }, [settings.course]);

  if (settings.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading settings…</p>
      </div>
    );
  }

  if (!settings.canEdit) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Course settings
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          Only instructors and admins can change course settings.
        </p>
      </div>
    );
  }

  if (settings.notFound || !settings.course) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          We couldn’t find that course.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="flex flex-wrap items-center gap-2 text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="rounded-[6px] bg-[var(--slate-tint)] px-2.5 py-0.5 text-[var(--slate)]">
              {settings.course.title}
            </span>
            <span>Course settings</span>
          </h1>
          <p className="mt-2 text-[13px]">
            <Link
              to={coursePath(settings.organization.slug, settings.course.id)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to {settings.course.title}
            </Link>
          </p>
          {settings.copiedFromCourseId ? (
            <p className="mt-2 text-[13px] text-[var(--ink-faint)]">
              This course was copied from another course. Edits stay on this copy.
            </p>
          ) : null}
        </div>
        <PageFormActions
          formId={COURSE_SETTINGS_FORM_ID}
          saving={settings.saving}
          hasChanges={settings.hasChanges}
          cancelTo={coursePath(settings.organization.slug, settings.course.id)}
          saveLabel="Save settings"
        />
      </div>

      <CourseVisibilityBanner
        visibility={settings.course.visibility}
        canEdit={settings.canEdit}
        pending={settings.setVisibility.isPending}
        onPublish={() => settings.setVisibility.mutate("published")}
      />

      <form
        id={COURSE_SETTINGS_FORM_ID}
        className="mt-6 grid items-start gap-4 lg:grid-cols-2"
        onSubmit={settings.onSubmit}
      >
        <div className="grid gap-4">
          <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Course</h2>
              {isCoursePublished(settings.course.visibility) ? (
                <PublishedBadge />
              ) : (
                <Badge variant="amber">Unpublished</Badge>
              )}
            </div>
            <label className="mt-4 flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
              <Input
                className="w-full"
                value={settings.title}
                onChange={(event) => settings.setTitle(event.target.value)}
                required
              />
            </label>
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                Description
              </span>
              <textarea
                className={`${controlClass} min-h-[4.5rem] resize-y`}
                value={settings.description}
                onChange={(event) => settings.setDescription(event.target.value)}
              />
            </label>
          </section>

          <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
              Schedule & status
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                  Start date
                </span>
                <Input
                  className="w-full"
                  type="date"
                  value={settings.startDate}
                  onChange={(event) => settings.setStartDate(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                  End date
                </span>
                <Input
                  className="w-full"
                  type="date"
                  value={settings.endDate}
                  onChange={(event) => settings.setEndDate(event.target.value)}
                />
              </label>
            </div>
            <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
              These dates are for your records. They don’t change who can see
              the course.
            </p>
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Status</span>
              <select
                className={controlClass}
                value={settings.status}
                onChange={(event) => settings.setStatus(event.target.value)}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <span className="text-[12px] text-[var(--ink-faint)]">
                Active courses are in use this term. Families still only see a
                course after you publish it.
              </span>
            </label>
            <CourseUnpublishControl
              visibility={settings.course.visibility}
              canEdit={settings.canEdit}
              pending={settings.setVisibility.isPending}
              onUnpublish={() => settings.setVisibility.mutate("unpublished")}
            />
          </section>

          {settings.formError ? (
            <p className="text-[13px] text-[var(--amber-deep)]">{settings.formError}</p>
          ) : null}
        </div>

        <div className="grid gap-4">
          <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
            <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
              How it appears
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
              Optional details for the course list.
            </p>
            <div className="mt-4">
              <CourseIconPicker
                value={settings.iconKey}
                onChange={settings.setIconKey}
              />
            </div>
            <div className="mt-3">
              <CourseColorPicker
                value={settings.colorKey}
                onChange={settings.setColorKey}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                  Subject
                </span>
                <Input
                  className="w-full"
                  value={settings.subject}
                  onChange={(event) => settings.setSubject(event.target.value)}
                  placeholder="Math, nature study…"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                  Location
                </span>
                <Input
                  className="w-full"
                  value={settings.location}
                  onChange={(event) => settings.setLocation(event.target.value)}
                  placeholder="Room A, the park…"
                />
              </label>
            </div>
            {settings.gradeLabels.length > 0 ? (
              <fieldset className="mt-3">
                <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
                  Grade levels
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.gradeLabels.map((label) => (
                    <label
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--line-soft)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--ink-soft)]"
                    >
                      <input
                        type="checkbox"
                        checked={settings.gradeLevels.includes(label)}
                        onChange={() => settings.toggleGrade(label)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </section>

          <InstructorsSection
            orgSlug={settings.organization.slug}
            instructors={settings.instructors}
            staff={settings.staff}
            canManage={settings.canManageInstructors}
            addUserId={settings.addUserId}
            onAddUserId={settings.setAddUserId}
            onAdd={() => settings.addInstructor.mutate()}
            onRemove={(userId) => settings.removeInstructor.mutate(userId)}
            adding={settings.addInstructor.isPending}
            addError={
              settings.addInstructor.error
                ? settings.addInstructor.error.message
                : null
            }
          />
        </div>
      </form>
    </div>
  );
}
