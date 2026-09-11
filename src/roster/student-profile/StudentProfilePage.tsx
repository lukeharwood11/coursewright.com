import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { enrollmentStatusLabel } from "@/roster/model/enrollment";
import { StudentProfileFields } from "./components/StudentProfileFields";
import { ParentInvitePanel } from "./components/ParentInvitePanel";
import { useStudentProfile } from "./hooks/useStudentProfile";
import { useParentInvite } from "./hooks/useParentInvite";

export function StudentProfilePage() {
  const profile = useStudentProfile();
  const parentInvite = useParentInvite(profile.student?.id ?? null);

  useEffect(() => {
    document.title = profile.student
      ? `${profile.student.name} · Course Wright`
      : "Student · Course Wright";
  }, [profile.student]);

  if (profile.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading student…</p>
      </div>
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
        {profile.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{profile.error}</p>
        ) : null}
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
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {profile.student.name}
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        Org-level student profile — no login in Course Wright yet.
      </p>

      <form
        className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
        onSubmit={profile.onSubmit}
      >
        <StudentProfileFields
          name={profile.name}
          parentEmail={profile.parentEmail}
          gradeLevel={profile.gradeLevel}
          gradeLabels={profile.gradeLabels}
          disabled={profile.saving}
          onNameChange={profile.setName}
          onParentEmailChange={profile.setParentEmail}
          onGradeLevelChange={profile.setGradeLevel}
        />
        {profile.formError ? (
          <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
            {profile.formError}
          </p>
        ) : null}
        <div className="mt-4">
          <Button type="submit" disabled={profile.saving}>
            {profile.saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      <ParentInvitePanel
        parentEmail={profile.student.parentEmail}
        canInvite={parentInvite.canInvite}
        loading={parentInvite.loading}
        loadError={parentInvite.loadError}
        pendingEmail={parentInvite.pending?.email ?? null}
        linked={parentInvite.linked}
        inviting={parentInvite.inviting}
        canceling={parentInvite.canceling}
        copied={parentInvite.copied}
        inviteUrl={parentInvite.inviteUrl}
        onInvite={parentInvite.onInvite}
        onCopy={parentInvite.onCopy}
        onCancel={parentInvite.onCancel}
      />

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
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

      <p className="mt-6 text-[13px]">
        <Link
          to={`${base}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Back to roster
        </Link>
      </p>
    </div>
  );
}
