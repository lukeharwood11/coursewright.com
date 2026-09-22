import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageEditorMediaProvider } from "@/materials/material/components/PageEditorMediaContext";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { EventFormFields } from "./components/EventFormFields";
import { EventMaterialsField } from "./components/EventMaterialsField";
import { EVENT_FORM_ID, useEventEdit } from "./hooks/useEventEdit";

const PageContentEditor = lazy(async () => {
  const module = await import("@/materials/material/components/PageContentEditor");
  return { default: module.PageContentEditor };
});

export function EventEditPage() {
  const page = useEventEdit();
  const user = useAuthedUser();

  useEffect(() => {
    document.title = page.isNew
      ? "New event · Course Wright"
      : page.title
        ? `Edit ${page.title} · Course Wright`
        : "Edit event · Course Wright";
  }, [page.isNew, page.title]);

  if (page.loading) return <PageLoading label="Loading event…" />;

  if (!page.canEdit) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Events
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          Switch to Teacher view to add or edit an event.
        </p>
      </div>
    );
  }

  if (page.notFound) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that event
        </h1>
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${page.organization.slug}/calendar`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to calendar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {page.isNew ? "New event" : "Edit event"}
      </h1>
      <form id={EVENT_FORM_ID} className="mt-6 max-w-2xl" onSubmit={page.onSubmit}>
        <EventFormFields
          audience={page.draft.audience}
          courseIds={page.draft.courseIds}
          classIds={page.draft.classIds}
          title={page.draft.title}
          location={page.draft.location}
          startsOn={page.draft.startsOn}
          endsOn={page.draft.endsOn}
          startTime={page.draft.startTime}
          endTime={page.draft.endTime}
          courses={page.courses}
          classes={page.classes}
          disabled={page.pending}
          onAudience={page.setAudience}
          onSelectCourse={page.selectCourse}
          onToggleClass={page.toggleClass}
          onTitle={page.setTitle}
          onLocation={page.setLocation}
          onStartsOn={page.setStartsOn}
          onEndsOn={page.setEndsOn}
          onStartTime={page.setStartTime}
          onEndTime={page.setEndTime}
        />
        <EventMaterialsField
          options={page.materials}
          selectedIds={page.draft.materialIds}
          disabled={page.pending}
          onToggle={page.toggleMaterial}
        />
        {page.formError ? (
          <p className="mt-4 text-[13.5px] font-semibold text-[var(--amber-deep)]">
            {page.formError}
          </p>
        ) : null}
      </form>

      <div className="mt-8 max-w-3xl">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Write-up</h2>
        <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
          Same kind of page as a lesson: notes, files, and links. This stays with the event.
        </p>
        <PageEditorMediaProvider
          value={{ organizationId: page.organization.id, userId: user.id }}
        >
          <Suspense fallback={<PageLoading embedded label="Loading editor…" />}>
            <div className="mt-3">
              <PageContentEditor
                blocks={page.blocks}
                editorKey={page.editorKey}
                editable
                onDraftChange={page.onDraftChange}
              />
            </div>
          </Suspense>
        </PageEditorMediaProvider>
      </div>

      <div className="mt-6 max-w-2xl">
        <PageFormActions
          formId={EVENT_FORM_ID}
          saving={page.saving}
          hasChanges={page.hasChanges}
          saveLabel={page.isNew ? "Add event" : "Save"}
          cancelTo={page.cancelTo}
        />
      </div>
    </div>
  );
}
