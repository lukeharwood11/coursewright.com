import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { BillingPlaceholder } from "@/billing";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  ORG_SETTINGS_FORM_ID,
  OrgSettingsForm,
} from "./components/OrgSettingsForm";
import { StaffSection } from "./components/StaffSection";
import { useOrgSettings } from "./hooks/useOrgSettings";
import { useOrgStaff } from "./hooks/useOrgStaff";
import { useToastOnError } from "@/ui/useToastOnError";

export function OrgSettingsPage() {
  const { orgSlug } = useParams();
  const shell = useOrgShell();
  const settings = useOrgSettings(orgSlug);
  const staff = useOrgStaff(settings.organization?.id, settings.role);
  useToastOnError(settings.error);

  useEffect(() => {
    const name = shell.organization.name;
    document.title = `${name} settings · Course Wright`;
  }, [shell.organization.name]);

  if (settings.loading) {
    return (
      <PageLoading label="Loading settings…" />
    );
  }

  if (shell.parentPresentation) {
    return <Navigate to={`/my/${shell.organization.slug}`} replace />;
  }

  if (!settings.organization || !settings.role) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          Settings aren’t available right now.
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
            Organization settings
          </h1>
          {!settings.canEdit ? (
            <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
              Only owners and admins can change these settings.
            </p>
          ) : null}
        </div>
        {settings.canEdit ? (
          <PageFormActions
            formId={ORG_SETTINGS_FORM_ID}
            saving={settings.saving}
            hasChanges={settings.hasChanges}
            cancelTo={`/my/${settings.organization.slug}`}
          />
        ) : null}
      </div>

      <div className="mt-6">
        <OrgSettingsForm
          canEdit={settings.canEdit}
          name={settings.name}
          slug={settings.slug}
          orgType={settings.orgType}
          gradeScheme={settings.gradeScheme}
          gradeLabelsText={settings.gradeLabelsText}
          confirmPermalinkChange={settings.confirmPermalinkChange}
          slugChanged={settings.slugChanged}
          error={settings.formError}
          onNameChange={settings.onNameChange}
          onSlugChange={settings.onSlugChange}
          onOrgTypeChange={settings.onOrgTypeChange}
          onGradeSchemeChange={settings.onGradeSchemeChange}
          onGradeLabelsTextChange={settings.onGradeLabelsTextChange}
          onConfirmPermalinkChange={settings.onConfirmPermalinkChange}
          onSubmit={settings.onSubmit}
        />
      </div>

      <div className="mt-4">
        <StaffSection
          orgSlug={settings.organization.slug}
          canInvite={staff.canInvite}
          canManage={staff.canManage}
          loading={staff.loading}
          loadError={staff.loadError}
          members={staff.members}
          pending={staff.pending}
          email={staff.email}
          role={staff.role}
          roles={staff.roles}
          formError={staff.formError}
          inviting={staff.inviting}
          copiedId={staff.copiedId}
          sendingId={staff.sendingId}
          cancelingId={staff.cancelingId}
          changingId={staff.changingId}
          removingId={staff.removingId}
          lastInviteSent={staff.lastInviteSent}
          onEmailChange={staff.onEmailChange}
          onRoleChange={staff.onRoleChange}
          onInvite={staff.onInvite}
          onCopy={staff.onCopy}
          onSendEmail={staff.onSendEmail}
          onCancel={staff.onCancel}
          onChangeRole={staff.onChangeRole}
          onRemove={staff.onRemove}
        />
      </div>

      {settings.showBilling ? (
        <div className="mt-4 max-w-xl">
          <BillingPlaceholder />
        </div>
      ) : null}
    </div>
  );
}
