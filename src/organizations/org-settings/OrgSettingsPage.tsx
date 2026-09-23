import { useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { BillingPlaceholder } from "@/billing";
import {
  canManageBranding,
  canManageCustomizations,
} from "@/organizations/model/role";
import { PageFormActions } from "@/ui/PageFormActions";
import { PageLoading } from "@/ui/PageLoading";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  ORG_SETTINGS_FORM_ID,
  OrgSettingsForm,
} from "./components/OrgSettingsForm";
import { BrandingSection } from "./components/BrandingSection";
import { CustomizationsSection } from "./components/CustomizationsSection";
import {
  OrgSettingsNav,
  parseOrgSettingsTab,
  type OrgSettingsTabId,
} from "./components/OrgSettingsNav";
import { StaffSection } from "./components/StaffSection";
import { useOrgSettings } from "./hooks/useOrgSettings";
import { useOrgStaff } from "./hooks/useOrgStaff";
import { useToastOnError } from "@/ui/useToastOnError";

function isFormTab(
  tab: OrgSettingsTabId,
): tab is Extract<OrgSettingsTabId, "organization" | "profile"> {
  return tab === "organization" || tab === "profile";
}

export function OrgSettingsPage() {
  const { orgSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const shell = useOrgShell();
  const settings = useOrgSettings(orgSlug);
  const staff = useOrgStaff(settings.organization?.id, settings.role);
  useToastOnError(settings.error);

  const showBilling = settings.showBilling;
  const tabFromUrl = parseOrgSettingsTab(searchParams.get("tab"), {
    showBilling,
  });
  const [activeTab, setActiveTab] = useState<OrgSettingsTabId>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    const name = shell.organization.name;
    document.title = `${name} settings · Course Wright`;
  }, [shell.organization.name]);

  function selectTab(tab: OrgSettingsTabId) {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "organization") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true },
    );
  }

  if (settings.loading) {
    return <PageLoading label="Loading settings…" />;
  }

  if (shell.parentPresentation) {
    return <Navigate to={`/my/${shell.organization.slug}`} replace />;
  }

  if (!settings.organization || !settings.role) {
    return (
      <div className="px-5 py-4 md:px-8">
        <p className="text-[14.5px] text-[var(--ink-soft)]">
          Settings aren’t available right now.
        </p>
      </div>
    );
  }

  const formSection = isFormTab(activeTab) ? activeTab : "organization";

  return (
    <div className="px-5 py-4 md:px-8">
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

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[12.5rem_minmax(0,42rem)] md:items-start md:gap-8">
        <aside className="min-w-0 md:sticky md:top-4">
          <OrgSettingsNav
            active={activeTab}
            showBilling={showBilling}
            onSelect={selectTab}
          />
        </aside>

        <div className="min-w-0">
          {settings.canEdit ? (
            <div className="mb-4 flex min-h-10 justify-end">
              <PageFormActions
                formId={ORG_SETTINGS_FORM_ID}
                saving={settings.saving}
                hasChanges={settings.hasChanges}
                cancelTo={`/my/${settings.organization.slug}`}
              />
            </div>
          ) : null}

          {/* Keep the settings form mounted on every tab so Save always
              has a target and the action row height stays stable. */}
          <div
            className={isFormTab(activeTab) ? undefined : "hidden"}
            aria-hidden={!isFormTab(activeTab)}
          >
            <OrgSettingsForm
              section={formSection}
              canEdit={settings.canEdit}
              name={settings.name}
              slug={settings.slug}
              orgType={settings.orgType}
              gradeScheme={settings.gradeScheme}
              gradeLabelsText={settings.gradeLabelsText}
              schoolDays={settings.schoolDays}
              about={settings.about}
              address={settings.address}
              website={settings.website}
              contactEmail={settings.contactEmail}
              phone={settings.phone}
              confirmPermalinkChange={settings.confirmPermalinkChange}
              slugChanged={settings.slugChanged}
              error={settings.formError}
              onNameChange={settings.onNameChange}
              onSlugChange={settings.onSlugChange}
              onOrgTypeChange={settings.onOrgTypeChange}
              onGradeSchemeChange={settings.onGradeSchemeChange}
              onGradeLabelsTextChange={settings.onGradeLabelsTextChange}
              onToggleSchoolDay={settings.onToggleSchoolDay}
              onAboutChange={settings.onAboutChange}
              onAddressChange={settings.onAddressChange}
              onWebsiteChange={settings.onWebsiteChange}
              onContactEmailChange={settings.onContactEmailChange}
              onPhoneChange={settings.onPhoneChange}
              onConfirmPermalinkChange={settings.onConfirmPermalinkChange}
              onSubmit={settings.onSubmit}
            />
          </div>

          {activeTab === "branding" ? (
            <div role="tabpanel">
              <BrandingSection
                organizationId={settings.organization.id}
                orgName={settings.organization.name}
                canManage={canManageBranding(settings.role)}
              />
            </div>
          ) : null}

          {activeTab === "customizations" ? (
            <div role="tabpanel">
              <CustomizationsSection
                organizationId={settings.organization.id}
                canManage={canManageCustomizations(settings.role)}
              />
            </div>
          ) : null}

          {activeTab === "collaborators" ? (
            <div role="tabpanel">
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
          ) : null}

          {activeTab === "billing" && showBilling ? (
            <div role="tabpanel">
              <BillingPlaceholder />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
