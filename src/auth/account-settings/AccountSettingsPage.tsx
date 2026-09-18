import { useEffect } from "react";
import { Button } from "@/ui/Button";
import { AccountProfileForm } from "./components/AccountProfileForm";
import { useAccountSettings } from "./hooks/useAccountSettings";

export function AccountSettingsPage() {
  const account = useAccountSettings();

  useEffect(() => {
    document.title = "Account · Course Wright";
  }, []);

  if (account.loading) {
    return (
      <div className="max-w-lg px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading account…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Account
      </h1>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        This is your Course Wright account — not a single organization.
      </p>

      {account.loadError ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {account.loadError}
        </p>
      ) : null}

      <AccountProfileForm
        name={account.name}
        email={account.email}
        error={account.formError}
        saving={account.saving}
        hasChanges={account.hasChanges}
        onNameChange={account.onNameChange}
        onSubmit={account.onSubmit}
      />

      {account.signOutError ? (
        <p className="mt-4 text-[13px] text-[var(--amber-deep)]" role="alert">
          {account.signOutError}
        </p>
      ) : null}

      <div className="mt-6">
        <Button
          variant="secondary"
          onClick={account.onSignOut}
          disabled={account.signingOut}
        >
          {account.signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
