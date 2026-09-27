import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import {
  OrgMemberAccessActions,
  orgMemberAccessModelFromPeopleRow,
} from "@/organizations/org-settings/components/OrgMemberAccessActions";
import { useOrgPeople } from "@/organizations/org-settings/hooks/useOrgPeople";
import { useOrgStaff } from "@/organizations/org-settings/hooks/useOrgStaff";
import {
  UserProfileContent,
  UserProfileNotFound,
} from "./components/UserProfileContent";
import { OrgPersonContactForm } from "./components/OrgPersonContactForm";
import {
  ORG_PERSON_CONTACT_FORM_ID,
  useUserProfile,
} from "./hooks/useUserProfile";

export function UserProfilePage() {
  const page = useUserProfile();
  const navigate = useNavigate();
  const people = useOrgPeople(page.organization.id, page.role);
  const staff = useOrgStaff(page.organization.id, page.role);

  const accessMember = useMemo(() => {
    const userId = page.profile?.userId;
    if (!userId) return null;
    return people.members.find((member) => member.userId === userId) ?? null;
  }, [page.profile?.userId, people.members]);

  const staffMember = useMemo(() => {
    const userId = page.profile?.userId;
    if (!userId) return null;
    return staff.members.find((member) => member.userId === userId) ?? null;
  }, [page.profile?.userId, staff.members]);

  const peopleTabPath = `/my/${page.organization.slug}/settings?tab=people`;

  const accessActions =
    accessMember != null
      ? orgMemberAccessModelFromPeopleRow(
          page.organization.slug,
          accessMember,
          {
            onSuspend: people.onSuspend,
            onReactivate: people.onReactivate,
            onRemoveFromOrg: (member) =>
              people.onRemoveFromOrg(member, () => {
                navigate(peopleTabPath);
              }),
          },
          {
            staff: staffMember,
            onRemoveAsCollaborator: (member) =>
              staff.onRemoveAsCollaborator(member, () => {
                navigate(peopleTabPath);
              }),
          },
        )
      : null;

  useEffect(() => {
    document.title = page.profile
      ? `${page.profile.name} · Course Wright`
      : "Profile · Course Wright";
  }, [page.profile]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading profile…</p>
      </div>
    );
  }

  if (page.notFound || !page.profile) {
    return (
      <div className="px-5 py-8 md:px-8">
        <UserProfileNotFound
          orgSlug={page.organization.slug}
          orgName={page.organization.name}
          error={page.error}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <UserProfileContent
        profile={page.profile}
        orgSlug={page.organization.slug}
        role={page.role}
        headerActions={
          accessActions ? (
            <OrgMemberAccessActions
              {...accessActions}
              busy={
                accessMember != null &&
                (people.busyMembershipId === accessMember.membershipId ||
                  staff.removingCollaboratorId === accessMember.membershipId)
              }
            />
          ) : null
        }
      />
      {page.canEditName ? (
        <OrgPersonContactForm
          formId={ORG_PERSON_CONTACT_FORM_ID}
          name={page.name}
          email={page.email}
          canEditEmail={page.canEditEmail}
          linkedEmailChangeWarning={page.linkedEmailChangeWarning}
          error={page.formError}
          saving={page.saving}
          hasChanges={page.hasChanges}
          onNameChange={page.onNameChange}
          onEmailChange={page.onEmailChange}
          onSubmit={page.onSubmit}
        />
      ) : null}
      <ConfirmDialog
        open={page.confirmLinkedEmailOpen}
        title="Change contact email?"
        body="This person already has a linked account. Saving a new contact email keeps them linked to this profile and does not change how they sign in. It only updates the organizer contact address on this row."
        confirmLabel="Save email"
        cancelLabel="Keep current email"
        onCancel={page.onCancelLinkedEmailSave}
        onConfirm={page.onConfirmLinkedEmailSave}
      />
    </div>
  );
}
