import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Avatar } from "@/ui/Avatar";
import { coursePath } from "@/courses/model/paths";
import { useCourseSettings } from "./hooks/useCourseSettings";
import { CourseVisibilityBanner } from "@/courses/course/components/CourseVisibilityBanner";

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
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Course settings
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

      {settings.course ? (
        <CourseVisibilityBanner
          visibility={settings.course.visibility}
          canEdit={settings.canEdit}
          pending={settings.setVisibility.isPending}
          onPublish={() => settings.setVisibility.mutate("published")}
          onUnpublish={() => settings.setVisibility.mutate("unpublished")}
        />
      ) : null}

      <form
        className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
        onSubmit={settings.onSubmit}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
          <Input
            className="w-full"
            value={settings.title}
            onChange={(event) => settings.setTitle(event.target.value)}
            required
          />
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Description</span>
          <textarea
            className={`${controlClass} min-h-[4.5rem] resize-y`}
            value={settings.description}
            onChange={(event) => settings.setDescription(event.target.value)}
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">
              Subject / area
            </span>
            <Input
              className="w-full"
              value={settings.subject}
              onChange={(event) => settings.setSubject(event.target.value)}
              placeholder="Math, nature study…"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Location</span>
            <Input
              className="w-full"
              value={settings.location}
              onChange={(event) => settings.setLocation(event.target.value)}
              placeholder="Room A, the park…"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Start date</span>
            <Input
              className="w-full"
              type="date"
              value={settings.startDate}
              onChange={(event) => settings.setStartDate(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">End date</span>
            <Input
              className="w-full"
              type="date"
              value={settings.endDate}
              onChange={(event) => settings.setEndDate(event.target.value)}
            />
          </label>
        </div>
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
            Active means this offering is running. Families still only see it
            after you publish.
          </span>
        </label>
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
        {settings.formError ? (
          <p className="mt-3 text-[13px] text-[var(--amber-deep)]">{settings.formError}</p>
        ) : null}
        <div className="mt-4">
          <Button type="submit" disabled={settings.saving}>
            {settings.saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>

      <section className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Instructors</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {settings.instructors.map((person) => (
            <li key={person.userId} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={person.name} size={28} />
                <span className="truncate text-[13.5px] font-semibold">{person.name}</span>
              </span>
              {settings.canManageInstructors ? (
                <Button
                  variant="secondary"
                  className="px-2.5 py-1.5 text-[12px]"
                  onClick={() => settings.removeInstructor.mutate(person.userId)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {settings.canManageInstructors ? (
          <form
            className="mt-4 flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!settings.addUserId) return;
              settings.addInstructor.mutate();
            }}
          >
            <select
              className={controlClass}
              value={settings.addUserId}
              onChange={(event) => settings.setAddUserId(event.target.value)}
            >
              <option value="">Add a co-teacher</option>
              {settings.staff.map((person) => (
                <option key={person.userId} value={person.userId}>
                  {person.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!settings.addUserId}>
              Add
            </Button>
          </form>
        ) : (
          <p className="mt-3 text-[13px] text-[var(--ink-faint)]">
            Owners and admins can add co-teachers.
          </p>
        )}
        {settings.addInstructor.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">
            {settings.addInstructor.error.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
