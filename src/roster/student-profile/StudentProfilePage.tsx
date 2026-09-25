import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { Button, ButtonLink } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PageFormActions } from "@/ui/PageFormActions";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { studentsHubTier } from "@/grading/model/access";
import { progressPath, studentsPath } from "@/grading/model/paths";
import { StudentGradesSection } from "@/grading";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { enrollmentStatusLabel } from "@/roster/model/enrollment";
import { StudentProfileFields } from "./components/StudentProfileFields";
import { ParentInvitePanel } from "./components/ParentInvitePanel";
import { StudentInvitePanel } from "./components/StudentInvitePanel";
import { useParentInvite } from "./hooks/useParentInvite";
import { useStudentInvite } from "./hooks/useStudentInvite";
import {
  STUDENT_PROFILE_FORM_ID,
  useStudentProfile,
} from "./hooks/useStudentProfile";
import { useAckNotificationFromSearch } from "@/notifications/activity/hooks/useAckNotificationFromSearch";
import { useToastOnError } from "@/ui/useToastOnError";

export function StudentProfilePage() {
  const profile = useStudentProfile();
  useAckNotificationFromSearch();
  const { organization, role, parentPresentation } = useOrgShell();
  const tier = studentsHubTier(role, parentPresentation);
  const canEdit = staffCanEdit(role, parentPresentation);
  const [confirmRemove, setConfirmRemove] = useState(false);
  useToastOnError(profile.error);
  const parentInvite = useParentInvite(profile.student?.id ?? null);
  const studentInvite = useStudentInvite(
    profile.student?.id ?? null,
    profile.student?.studentEmail ?? null,
  );
  useToastOnError(parentInvite.loadError);
  useToastOnError(studentInvite.loadError);

  useEffect(() => {
    document.title = profile.student
      ? `${profile.student.name} · Course Wright`
      : "Student · Course Wright";
  }, [profile.student]);

  if (tier === "learner") {
    return <Navigate to={progressPath(organization.slug)} replace />;
  }

  if (profile.loading) {
    return (
      <PageLoading label="Loading student…" />
    );
  }

  if (profile.notFound || !profile.student) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          We couldn’t find that student
        </h1>
        <p className="mt-2 text-[14.5px] text-[var(--ink-soft)]">
          They may have been removed, or you may not have access.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={studentsPath(profile.organization.slug)}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to students
          </Link>
        </p>
      </div>
    );
  }

  const base = `/my/${profile.organization.slug}`;

  return (
    <div>
      <DetailPageHeader
        backTo={studentsPath(profile.organization.slug)}
        backLabel="Back to students"
        title={profile.student.name}
        actions={
          canEdit ? (
          <>
            {organization.features.announcements ? (
              <ButtonLink
                variant="secondary"
                to={newAnnouncementPath(profile.organization.slug, {
                  audience: "student",
                  studentId: profile.student.id,
                })}
              >
                <MegaphoneIcon className="h-5 w-5" aria-hidden />
                Create Announcement
              </ButtonLink>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              disabled={profile.removing}
              onClick={() => setConfirmRemove(true)}
            >
              {profile.removing ? "Removing…" : "Remove"}
            </Button>
            <PageFormActions
              formId={STUDENT_PROFILE_FORM_ID}
              saving={profile.saving}
              hasChanges={profile.hasChanges}
              cancelTo={studentsPath(profile.organization.slug)}
            />
          </>
          ) : null
        }
      />
      <div className="space-y-6 px-5 pt-4 pb-6 md:px-8">
      <StudentGradesSection studentId={profile.student.id} />
      {canEdit ? (
      <>
      <form
        id={STUDENT_PROFILE_FORM_ID}
        className="max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
        onSubmit={profile.onSubmit}
      >
        <StudentProfileFields
          name={profile.name}
          parentEmail={profile.student.parentEmail ?? ""}
          studentEmail={profile.studentEmail}
          gradeLevel={profile.gradeLevel}
          gradeLabels={profile.gradeLabels}
          disabled={profile.saving}
          showParentEmail={false}
          onNameChange={profile.setName}
          onParentEmailChange={() => undefined}
          onStudentEmailChange={profile.setStudentEmail}
          onGradeLevelChange={profile.setGradeLevel}
        />
        {profile.formError ? (
          <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
            {profile.formError}
          </p>
        ) : null}
      </form>

      <ParentInvitePanel
        parentEmail={profile.student.parentEmail}
        canInvite={parentInvite.canInvite}
        loading={parentInvite.loading}
        loadError={parentInvite.loadError}
        pending={parentInvite.pending}
        linked={parentInvite.linked}
        addEmail={parentInvite.addEmail}
        invitingEmail={parentInvite.invitingEmail}
        cancelingId={parentInvite.cancelingId}
        sendingId={parentInvite.sendingId}
        copiedId={parentInvite.copiedId}
        origin={parentInvite.origin}
        orgMemberForEmail={parentInvite.orgMemberForEmail}
        onAddEmailChange={parentInvite.setAddEmail}
        onInvite={parentInvite.onInvite}
        onCopy={parentInvite.onCopy}
        onSendEmail={parentInvite.onSendEmail}
        onCancel={parentInvite.onCancel}
      />

      <StudentInvitePanel
        studentEmail={profile.student.studentEmail}
        canInvite={studentInvite.canInvite}
        loading={studentInvite.loading}
        account={studentInvite.account}
        pending={studentInvite.pending}
        inviting={studentInvite.inviting}
        cancelingId={studentInvite.cancelingId}
        sendingId={studentInvite.sendingId}
        copiedId={studentInvite.copiedId}
        origin={studentInvite.origin}
        onInvite={studentInvite.onInvite}
        onCopy={studentInvite.onCopy}
        onSendEmail={studentInvite.onSendEmail}
        onCancel={studentInvite.onCancel}
      />
      </>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Courses</h2>
          {profile.enrollments.length === 0 ? (
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
              Not enrolled in a course yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line-soft)]">
              {profile.enrollments.map((enrollment) => (
                <li key={enrollment.id} className="flex items-center gap-3 py-2">
                  <Link
                    to={
                      canEdit
                        ? `${base}/courses/${enrollment.courseId}/roster`
                        : `${base}/courses/${enrollment.courseId}`
                    }
                    className="min-w-0 flex-1 truncate text-[14.5px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
                  >
                    {enrollment.courseTitle}
                  </Link>
                  <Badge
                    variant={enrollment.status === "active" ? "green" : "neutral"}
                  >
                    {enrollmentStatusLabel(enrollment.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Classes</h2>
          {profile.classes.length === 0 ? (
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
              Not in a class yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--line-soft)]">
              {profile.classes.map((classGroup) => (
                <li key={classGroup.id} className="py-2">
                  <Link
                    to={`${base}/classes/${classGroup.id}`}
                    className="text-[14.5px] font-extrabold text-[var(--ink)] hover:text-[var(--green-deep)]"
                  >
                    {classGroup.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove student?"
        body={`${profile.student.name} will leave the roster, including their classes and courses.`}
        confirmLabel="Remove"
        cancelLabel="Keep them"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          profile.onRemove();
        }}
      />
    </div>
  );
}
