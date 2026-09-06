import { useEffect } from "react";
import { CreateOrganizationForm } from "./components/CreateOrganizationForm";
import { OrgList } from "./components/OrgList";
import { useOrgPicker } from "./hooks/useOrgPicker";

export function OrgPickerPage() {
  const picker = useOrgPicker();

  useEffect(() => {
    document.title = "Organizations · Course Wright";
  }, []);

  const isEmpty = !picker.loading && picker.memberships.length === 0;

  return (
    <div className="max-w-lg px-5 py-8 md:px-8">
      <div>
        <h1
          className="text-[24px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Your organizations
        </h1>
        <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
          Choose an organization to open, or create a new one.
        </p>
      </div>

      {picker.loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">
          Loading organizations…
        </p>
      ) : null}

      {picker.loadError ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {picker.loadError}
        </p>
      ) : null}

      {!picker.loading && picker.memberships.length > 0 ? (
        <div className="mt-6">
          <OrgList memberships={picker.memberships} />
        </div>
      ) : null}

      {isEmpty && !picker.loadError ? (
        <p className="mt-6 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          You’re not in an organization yet. Create one to start planning
          courses and materials.
        </p>
      ) : null}

      <div className="mt-6">
        <CreateOrganizationForm
          name={picker.name}
          slug={picker.slug}
          error={picker.formError}
          submitting={picker.creating}
          emptyState={isEmpty}
          onNameChange={picker.onNameChange}
          onSlugChange={picker.onSlugChange}
          onSubmit={picker.onCreate}
        />
      </div>
    </div>
  );
}
