import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageFormActions } from "@/ui/PageFormActions";
import { coursePath } from "@/courses/model/paths";
import { BulletinFormFields } from "./components/BulletinFormFields";
import { BULLETIN_FORM_ID, useBulletinEdit } from "./hooks/useBulletinEdit";

export function BulletinEditPage() {
  const page = useBulletinEdit();

  useEffect(() => {
    document.title = page.isNew
      ? "New bulletin · Course Wright"
      : page.title
        ? `Edit ${page.title} · Course Wright`
        : "Edit bulletin · Course Wright";
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
          Bulletins
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          Only instructors and admins can add or edit these notes.
        </p>
      </div>
    );
  }

  if (page.notFound || !page.course) {
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
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {page.isNew ? "New bulletin" : "Edit bulletin"}
          </h1>
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
            Families see this on their home between the dates you choose.
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              to={coursePath(page.organization.slug, page.course.id)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to {page.course.title}
            </Link>
          </p>
        </div>
        <PageFormActions
          formId={BULLETIN_FORM_ID}
          saving={page.saving}
          hasChanges={page.hasChanges}
          cancelTo={page.cancelTo}
          saveLabel={page.isNew ? "Post bulletin" : "Save bulletin"}
        />
      </div>

      <form
        id={BULLETIN_FORM_ID}
        className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
        onSubmit={page.onSubmit}
      >
        <BulletinFormFields
          title={page.title}
          body={page.body}
          startDate={page.startDate}
          endDate={page.endDate}
          materialIds={page.materialIds}
          materials={page.materials}
          units={page.units}
          onTitle={page.setTitle}
          onBody={page.setBody}
          onStartDate={page.setStartDate}
          onEndDate={page.setEndDate}
          onToggleMaterial={page.toggleMaterial}
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
