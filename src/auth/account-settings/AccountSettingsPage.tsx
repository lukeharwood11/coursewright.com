import { useEffect } from "react";
import { Button } from "@/ui/Button";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { PushNotificationSetting } from "@/notifications";
import { AccountProfileForm } from "./components/AccountProfileForm";
import { useAccountSettings } from "./hooks/useAccountSettings";

export function AccountSettingsPage() {
  const account = useAccountSettings();
  useToastOnError(account.loadError);
  useToastOnError(account.signOutError);

  useEffect(() => {
    document.title = "Account · Course Wright";
  }, []);

  if (account.loading) {
    return (
      <PageLoading label="Loading account…" />
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

      <AccountProfileForm
        name={account.name}
        email={account.email}
        error={account.formError}
        saving={account.saving}
        hasChanges={account.hasChanges}
        onNameChange={account.onNameChange}
        onSubmit={account.onSubmit}
      />

      <PushNotificationSetting />

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
