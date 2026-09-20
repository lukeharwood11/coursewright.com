import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChatBubbleLeftRightIcon, MegaphoneIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { Button, ButtonLink } from "@/ui/Button";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { newDiscussionPath } from "@/discussions/model/paths";
import { AddStudentsPanel } from "@/roster/student-profile/components/AddStudentsPanel";
import { StudentRosterList } from "@/roster/student-profile/components/StudentRosterList";
import { ClassLeadsSection } from "./components/ClassLeadsSection";
import { useClassRoster } from "./hooks/useClassRoster";

export function ClassRosterPage() {
  const roster = useClassRoster();

  useEffect(() => {
    document.title = roster.classGroup
      ? `${roster.classGroup.title} · Course Wright`
      : "Class · Course Wright";
  }, [roster.classGroup]);

  if (roster.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading class…</p>
      </div>
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
        {roster.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{roster.error}</p>
        ) : null}
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${roster.organization.slug}/roster`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to roster
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
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {roster.classGroup.title}
      </h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink
          variant="secondary"
          to={newDiscussionPath(roster.organization.slug, {
            audience: "class",
            classId: roster.classGroup.id,
          })}
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
          Start a discussion
        </ButtonLink>
        <ButtonLink
          variant="secondary"
          to={newAnnouncementPath(roster.organization.slug, {
            audience: "class",
            classId: roster.classGroup.id,
          })}
        >
          <MegaphoneIcon className="h-5 w-5" aria-hidden />
          Create Announcement
        </ButtonLink>
      </div>

      <ClassLeadsSection
        leads={roster.leads}
        staff={roster.staff}
        canManage={roster.canManageLeads}
        addUserId={roster.addLeadUserId}
        onAddUserId={roster.setAddLeadUserId}
        onAdd={roster.addLead}
        onRemove={roster.onRemoveLead}
        adding={roster.addingLead}
        addError={roster.addLeadError}
      />

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">
            Students
          </h2>
          {!roster.panelOpen ? (
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
          trailing={(student) => {
            const memberId = memberIdByStudent.get(student.id);
            if (!memberId) return null;
            return (
              <Button
                variant="secondary"
                onClick={() => roster.onRemove(memberId)}
                disabled={roster.removingId === memberId}
              >
                {roster.removingId === memberId ? "Removing…" : "Remove"}
              </Button>
            );
          }}
        />
      </section>

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

      <p className="mt-6 text-[13px]">
        <Link
          to={`/my/${roster.organization.slug}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to roster
        </Link>
      </p>
    </div>
  );
}
