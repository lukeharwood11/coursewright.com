import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageFormActions } from "@/ui/PageFormActions";
import { announcementsPath } from "@/announcements/model/paths";
import { AnnouncementFormFields } from "./components/AnnouncementFormFields";
import {
  ANNOUNCEMENT_FORM_ID,
  useAnnouncementEdit,
} from "./hooks/useAnnouncementEdit";

export function AnnouncementEditPage() {
  const page = useAnnouncementEdit();

  useEffect(() => {
    document.title = page.isNew
      ? "New announcement · Course Wright"
      : page.title
        ? `Edit ${page.title} · Course Wright`
        : "Edit announcement · Course Wright";
  }, [page.isNew, page.title]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading…</p>
      </div>
    );
  }

  if (!page.canEdit) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Announcements
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          Only instructors and admins can add or edit these notes.
        </p>
      </div>
    );
  }

  if (page.notFound) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          We couldn’t find that announcement.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.isNew ? "New announcement" : "Edit announcement"}
          </h1>
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
            Families see this on their home. There isn’t a place to reply.
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              to={announcementsPath(page.organization.slug)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to announcements
            </Link>
          </p>
        </div>
        <PageFormActions
          formId={ANNOUNCEMENT_FORM_ID}
          saving={page.saving}
          hasChanges={page.hasChanges}
          cancelTo={page.cancelTo}
          saveLabel={page.isNew ? "Post announcement" : "Save announcement"}
        />
      </div>

      <form
        id={ANNOUNCEMENT_FORM_ID}
        className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
        onSubmit={page.onSubmit}
      >
        <AnnouncementFormFields
          isNew={page.isNew}
          audience={page.audience}
          courseId={page.courseId}
          classId={page.classId}
          studentId={page.studentId}
          title={page.title}
          body={page.body}
          startDate={page.startDate}
          endDate={page.endDate}
          courses={page.courses}
          classes={page.classes}
          students={page.students}
          onAudience={page.setAudience}
          onCourseId={page.setCourseId}
          onClassId={page.setClassId}
          onStudentId={page.setStudentId}
          onTitle={page.setTitle}
          onBody={page.setBody}
          onStartDate={page.setStartDate}
          onEndDate={page.setEndDate}
        />
        {page.formError ? (
          <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
            {page.formError}
          </p>
        ) : null}
      </form>
    </div>
  );
}
