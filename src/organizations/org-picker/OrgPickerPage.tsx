import { useEffect } from "react";
import { PageLoading } from "@/ui/PageLoading";
import { CreateOrganizationForm } from "./components/CreateOrganizationForm";
import { OrgList } from "./components/OrgList";
import { PendingInvites } from "./components/PendingInvites";
import { useOrgPicker } from "./hooks/useOrgPicker";
import { usePendingStaffInvites } from "./hooks/usePendingStaffInvites";

export function OrgPickerPage() {
  const picker = useOrgPicker();
  const pending = usePendingStaffInvites();

  useEffect(() => {
    document.title = "Organizations · Course Wright";
  }, []);

  const noMemberships = !picker.loading && picker.memberships.length === 0;
  const isEmpty = noMemberships && !pending.loading && pending.invites.length === 0;

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
        <PageLoading embedded label="Loading organizations…" />
      ) : null}

      {picker.loadError ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {picker.loadError}
        </p>
      ) : null}

      {pending.loadError ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {pending.loadError}
        </p>
      ) : null}

      <PendingInvites
        invites={pending.invites}
        acceptingId={pending.acceptingId}
        error={pending.acceptError}
        onAccept={pending.onAccept}
      />

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
          emptyState={noMemberships}
          onNameChange={picker.onNameChange}
          onSlugChange={picker.onSlugChange}
          onSubmit={picker.onCreate}
        />
      </div>
    </div>
  );
}
