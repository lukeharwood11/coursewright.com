import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { BillingPlaceholder } from "@/billing";
import { Button } from "@/ui/Button";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  ORG_SETTINGS_FORM_ID,
  OrgSettingsForm,
} from "./components/OrgSettingsForm";
import { StaffSection } from "./components/StaffSection";
import { useOrgSettings } from "./hooks/useOrgSettings";
import { useOrgStaff } from "./hooks/useOrgStaff";

export function OrgSettingsPage() {
  const { orgSlug } = useParams();
  const shell = useOrgShell();
  const settings = useOrgSettings(orgSlug);
  const staff = useOrgStaff(settings.organization?.id ?? "", settings.role);

  useEffect(() => {
    const name = shell.organization.name;
    document.title = `${name} settings · Course Wright`;
  }, [shell.organization.name]);

  if (settings.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading settings…</p>
      </div>
    );
  }

  if (shell.role === "parent") {
    return (
      <div className="max-w-lg px-5 py-8 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Organization settings
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          Only owners and admins can change organization settings.
        </p>
        <p className="mt-4 text-[13px]">
          <Link
            to={`/my/${shell.organization.slug}`}
            className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
          >
            Back to {shell.organization.name}
          </Link>
        </p>
      </div>
    );
  }

  if (!settings.organization || !settings.role) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          Settings aren’t available right now.
        </p>
        {settings.error ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]">{settings.error}</p>
        ) : null}
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
          <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
            {settings.canEdit
              ? "Name, permalink, type, grades, and who can help run this organization."
              : "Only owners and admins can change these settings."}
          </p>
        </div>
        {settings.canEdit ? (
          <Button
            type="submit"
            form={ORG_SETTINGS_FORM_ID}
            disabled={settings.saving}
          >
            {settings.saving ? "Saving…" : "Save"}
          </Button>
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
          canInvite={staff.canInvite}
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
          cancelingId={staff.cancelingId}
          lastInviteUrl={staff.lastInviteUrl}
          lastInvite={staff.lastInvite}
          onEmailChange={staff.onEmailChange}
          onRoleChange={staff.onRoleChange}
          onInvite={staff.onInvite}
          onCopy={staff.onCopy}
          onCancel={staff.onCancel}
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
