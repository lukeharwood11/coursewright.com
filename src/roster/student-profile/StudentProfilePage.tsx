import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/ui/Badge";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { ButtonLink } from "@/ui/Button";
import { PageFormActions } from "@/ui/PageFormActions";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { enrollmentStatusLabel } from "@/roster/model/enrollment";
import { StudentProfileFields } from "./components/StudentProfileFields";
import { ParentInvitePanel } from "./components/ParentInvitePanel";
import { useParentInvite } from "./hooks/useParentInvite";
import {
  STUDENT_PROFILE_FORM_ID,
  useStudentProfile,
} from "./hooks/useStudentProfile";
import { useToastOnError } from "@/ui/useToastOnError";

export function StudentProfilePage() {
  const profile = useStudentProfile();
  useToastOnError(profile.error);
  const parentInvite = useParentInvite(profile.student?.id ?? null);

  useEffect(() => {
    document.title = profile.student
      ? `${profile.student.name} · Course Wright`
      : "Student · Course Wright";
  }, [profile.student]);

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
            to={`/my/${profile.organization.slug}/roster`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to roster
          </Link>
        </p>
      </div>
    );
  }

  const base = `/my/${profile.organization.slug}`;

  return (
    <div>
      <DetailPageHeader
        backTo={`/my/${profile.organization.slug}/roster`}
        backLabel="Back to roster"
        title={profile.student.name}
        actions={
          <>
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
            <PageFormActions
              formId={STUDENT_PROFILE_FORM_ID}
              saving={profile.saving}
              hasChanges={profile.hasChanges}
              cancelTo={`/my/${profile.organization.slug}/roster`}
            />
          </>
        }
      />
      <div className="space-y-6 px-5 pt-4 pb-6 md:px-8">
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
        studentEmail={profile.student.studentEmail}
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
        onAddEmailChange={parentInvite.setAddEmail}
        onInvite={parentInvite.onInvite}
        onCopy={parentInvite.onCopy}
        onSendEmail={parentInvite.onSendEmail}
        onCancel={parentInvite.onCancel}
      />

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
                    to={`${base}/courses/${enrollment.courseId}/roster`}
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
    </div>
  );
}
