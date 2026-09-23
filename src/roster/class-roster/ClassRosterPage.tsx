import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChatBubbleLeftRightIcon, MegaphoneIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { studentsHubTier } from "@/grading/model/access";
import { progressPath, studentsClassesPath } from "@/grading/model/paths";
import type { StudentSummary } from "@/roster/databridge/students";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { newDiscussionPath } from "@/discussions/model/paths";
import { AddStudentsPanel } from "@/roster/student-profile/components/AddStudentsPanel";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { ClassActionsMenu } from "./components/ClassActionsMenu";
import { ClassEventsSection } from "./components/ClassEventsSection";
import { ClassLeadsSection } from "./components/ClassLeadsSection";
import { useClassEvents } from "./hooks/useClassEvents";
import { useClassRoster } from "./hooks/useClassRoster";
import { useToastOnError } from "@/ui/useToastOnError";

type PendingClassRemove = {
  student: StudentSummary;
  memberId: number;
};

export function ClassRosterPage() {
  const roster = useClassRoster();
  const { organization, role, parentPresentation } = useOrgShell();
  const canManage = staffCanEdit(role, parentPresentation);
  const backTo =
    studentsHubTier(role, parentPresentation) === "learner"
      ? progressPath(organization.slug)
      : studentsClassesPath(organization.slug);
  const [pendingRemove, setPendingRemove] = useState<PendingClassRemove | null>(null);
  const showDiscussions = organization.features.discussions;
  const showAnnouncements = organization.features.announcements;
  const showEvents = organization.features.events;
  const eventsQuery = useClassEvents(
    roster.classGroup?.id ?? NaN,
    Boolean(roster.classGroup) && showEvents,
  );
  useToastOnError(roster.error);

  useEffect(() => {
    document.title = roster.classGroup
      ? `${roster.classGroup.title} · Course Wright`
      : "Class · Course Wright";
  }, [roster.classGroup]);

  if (roster.loading) {
    return (
      <PageLoading label="Loading class…" />
    );
  }

  if (roster.notFound || !roster.classGroup) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that class
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          It may have been removed, or you may not have access.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={backTo}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to students
          </Link>
        </p>
      </div>
    );
  }

  const students = roster.members.map((member) => member.student);
  const memberIdByStudent = new Map(
    roster.members.map((member) => [member.student.id, member.id]),
  );

  return (
    <div>
      <DetailPageHeader
        backTo={backTo}
        backLabel="Back to students"
        title={roster.classGroup.title}
        titleTrailing={
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            {canManage && showDiscussions ? (
              <ButtonLink
                variant="secondary"
                className="max-xl:hidden shrink-0"
                to={newDiscussionPath(roster.organization.slug, {
                  audience: "class",
                  classId: roster.classGroup.id,
                })}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
                Start a discussion
              </ButtonLink>
            ) : null}
            {canManage && showAnnouncements ? (
              <ButtonLink
                variant="secondary"
                className="max-xl:hidden shrink-0"
                to={newAnnouncementPath(roster.organization.slug, {
                  audience: "class",
                  classId: roster.classGroup.id,
                })}
              >
                <MegaphoneIcon className="h-5 w-5" aria-hidden />
                Create Announcement
              </ButtonLink>
            ) : null}
            {canManage ? (
            <ClassActionsMenu
              orgSlug={roster.organization.slug}
              classId={roster.classGroup.id}
              canEdit
              className="xl:hidden"
            />
            ) : null}
          </div>
        }
      />
      <div className="space-y-6 px-5 pt-4 pb-6 md:px-8">
      {showEvents ? (
        <ClassEventsSection
          orgSlug={roster.organization.slug}
          classId={roster.classGroup.id}
          events={eventsQuery.data ?? []}
          canEdit={canManage}
        />
      ) : null}
      <ClassLeadsSection
        orgSlug={roster.organization.slug}
        leads={roster.leads}
        staff={roster.staff}
        canManage={canManage && roster.canManageLeads}
        addOpen={roster.addLeadOpen}
        onOpenAdd={roster.openAddLead}
        onCloseAdd={roster.closeAddLead}
        onAdd={roster.addLead}
        onRemove={roster.onRemoveLead}
        adding={roster.addingLead}
        addError={roster.addLeadError}
      />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
            Students
          </h2>
          {canManage && !roster.panelOpen ? (
            <Button type="button" onClick={roster.openPanel}>
              <UserPlusIcon className="h-5 w-5" aria-hidden />
              Add students
            </Button>
          ) : null}
        </div>
        <StudentRosterList
          students={students}
          orgSlug={roster.organization.slug}
          emptyMessage="No students in this class yet."
          trailing={
            canManage
              ? (student) => {
            const memberId = memberIdByStudent.get(student.id);
            if (!memberId) return null;
            return (
              <Button
                variant="secondary"
                onClick={() => setPendingRemove({ student, memberId })}
                disabled={roster.removingId === memberId}
              >
                {roster.removingId === memberId ? "Removing…" : "Remove"}
              </Button>
            );
          }
              : undefined
          }
        />
      </section>

      {canManage ? (
      <AddStudentsPanel
        open={roster.panelOpen}
        onClose={roster.closePanel}
        title="Add students"
        disclaimer="Adding here does not enroll anyone in a course. Use a course roster to enroll."
        tab={roster.tab}
        onTabChange={roster.setTab}
        students={roster.availableStudents}
        selectedIds={roster.selectedIds}
        existingError={roster.existingError}
        existingSaving={roster.addingExisting}
        existingConfirmLabel={(count) =>
          count === 1 ? "Add 1 student" : `Add ${count} students`
        }
        existingEmptyMessage={
          roster.members.length === 0
            ? "No one in the org yet. Create new students to put them in this class."
            : "Everyone already in the org is in this class. Create new students below."
        }
        onToggle={roster.onToggle}
        onSelectFiltered={roster.onSelectFiltered}
        onClear={roster.onClearSelection}
        onConfirmExisting={roster.onConfirmExisting}
        drafts={roster.drafts}
        pasteText={roster.pasteText}
        gradeLabels={roster.gradeLabels}
        newError={roster.newError}
        newSaving={roster.addingNew}
        newSubmitLabel={(count) =>
          count === 1
            ? "Create and add 1 student"
            : `Create and add ${count} students`
        }
        onDraftChange={roster.setDraft}
        onAddRow={roster.onAddRow}
        onRemoveRow={roster.onRemoveRow}
        onPasteTextChange={roster.setPasteText}
        onApplyPaste={roster.onApplyPaste}
        onSubmitNew={roster.onSubmitNew}
      />
      ) : null}

      <ConfirmDialog
        open={pendingRemove != null}
        title="Remove from class?"
        body={
          pendingRemove
            ? `${pendingRemove.student.name} will leave this class only. They stay on the organization roster and in their courses.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Keep them"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) return;
          const { memberId } = pendingRemove;
          setPendingRemove(null);
          roster.onRemove(memberId);
        }}
      />
      </div>
    </div>
  );
}
