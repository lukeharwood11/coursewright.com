import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { BillingPlaceholder } from "@/billing";
import { PageFormActions } from "@/ui/PageFormActions";
import { toastNotImplemented } from "@/ui/toast";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  ORG_SETTINGS_FORM_ID,
  OrgSettingsForm,
} from "./components/OrgSettingsForm";
import { useOrgSettings } from "./hooks/useOrgSettings";

export function OrgSettingsPage() {
  const { orgSlug } = useParams();
  const shell = useOrgShell();
  const settings = useOrgSettings(orgSlug);

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
              ? "Name, permalink, type, and how grades work."
              : "Only owners and admins can change these settings."}
          </p>
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section
          className={`rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 ${
            settings.showBilling ? "" : "lg:col-span-2"
          }`}
        >
          <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Staff</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
            Invite owners, admins, and instructors, and change roles, from this
            page next.
          </p>
          {settings.canEdit ? (
            <div className="mt-4">
              <button
                type="button"
                className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                onClick={() => toastNotImplemented("Invite staff")}
              >
                Invite staff
              </button>
            </div>
          ) : null}
        </section>

        {settings.showBilling ? <BillingPlaceholder /> : null}
      </div>
    </div>
  );
}
