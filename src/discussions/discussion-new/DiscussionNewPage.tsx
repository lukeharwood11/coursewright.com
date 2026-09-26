import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { discussionsPath } from "@/discussions/model/paths";
import { OBSERVER_VIEW_ONLY_HINT } from "@/organizations/model/role";
import { MessageComposer } from "@/discussions/discussion/components/MessageComposer";
import { DiscussionNewFormFields } from "./components/DiscussionNewFormFields";
import {
  DISCUSSION_FORM_ID,
  useDiscussionNew,
} from "./hooks/useDiscussionNew";

export function DiscussionNewPage() {
  const page = useDiscussionNew();

  useEffect(() => {
    document.title = "New discussion · Course Wright";
  }, []);

  if (page.loading || page.redirectHome) {
    return (
      <PageLoading label="Loading…" />
    );
  }

  if (page.viewOnly) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          New discussion
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          {OBSERVER_VIEW_ONLY_HINT}
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={discussionsPath(page.organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to discussions
          </Link>
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
            New discussion
          </h1>
          <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
            Start a thread for a course, a class, or the whole organization.
          </p>
          <p className="mt-3 text-[13px]">
            <Link
              to={discussionsPath(page.organization.slug)}
              className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
            >
              Back to discussions
            </Link>
          </p>
        </div>
        <PageFormActions
          formId={DISCUSSION_FORM_ID}
          saving={page.saving}
          hasChanges={page.hasChanges}
          canSave={page.canSave}
          cancelTo={page.cancelTo}
          saveLabel="Start discussion"
        />
      </div>

      <form
        id={DISCUSSION_FORM_ID}
        className="mt-6 max-w-xl"
        onSubmit={page.onSubmit}
      >
        <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <DiscussionNewFormFields
            audience={page.audience}
            familyAudience={page.familyAudience}
            courseId={page.courseId}
            classId={page.classId}
            title={page.title}
            courses={page.courses}
            classes={page.classes}
            courseEmptyHint={page.courseEmptyHint}
            classEmptyHint={page.classEmptyHint}
            showOrganization={page.showOrganization}
            showFamilyAudience={page.showFamilyAudience}
            onAudience={page.setAudience}
            onFamilyAudience={page.setFamilyAudience}
            onCourseId={page.setCourseId}
            onClassId={page.setClassId}
            onTitle={page.setTitle}
            showNotifyAll={page.showNotifyAll}
            notifyAll={page.notifyAll}
            onNotifyAll={page.setNotifyAll}
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-bold text-[var(--ink-soft)]">
            First post
          </p>
          <MessageComposer
            mode={page.mode}
            onMode={page.setMode}
            body={page.body}
            onBody={page.setBody}
            lexical={page.lexical}
            onLexical={page.setLexical}
            attachments={page.attachments}
            onAttachments={page.setAttachments}
            materials={page.materials}
            canSubmit={page.canSave}
            submitting={page.saving}
            submitLabel="Start discussion"
            placeholder="Write the first post, or add a file, material, or link."
            error={page.formError}
            onSubmit={page.start}
            showSubmit={false}
            mentionPeople={page.mentionPeople}
            mentionExcludeUserId={page.userId}
            mentionsLoading={page.mentionsLoading}
          />
        </div>
      </form>
    </div>
  );
}
