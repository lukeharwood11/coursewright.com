import { Outlet, useOutletContext, useParams } from "react-router-dom";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { AppShellFrame } from "./components/AppShellFrame";
import { OrgNotFound } from "./components/OrgNotFound";
import { useOrgShellData } from "./hooks/useOrgShell";
import { OrgShellContext } from "./OrgShellContext";

export function OrgLayout() {
  const { orgSlug } = useParams();
  const auth = useOutletContext<AuthedOutletContext>();
  const shell = useOrgShellData(orgSlug);

  if (shell.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading organization…</p>
      </main>
    );
  }

  if (shell.notFound || !shell.organization || !shell.role) {
    return <OrgNotFound error={shell.error} />;
  }

  return (
    <OrgShellContext.Provider
      value={{
        brandLabel: shell.brandLabel,
        brandHref: shell.brandHref,
        navLabel: shell.navLabel,
        organization: shell.organization,
        role: shell.role,
        profileName: shell.profileName,
        profileEmail: shell.profileEmail,
        navSections: shell.navSections,
        showSearch: shell.showSearch,
      }}
    >
      <AppShellFrame>
        <Outlet context={auth} />
      </AppShellFrame>
    </OrgShellContext.Provider>
  );
}
