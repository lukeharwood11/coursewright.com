import { Outlet, useOutletContext, useParams } from "react-router-dom";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { OrgNotFound } from "./components/OrgNotFound";
import { useOrgShellData } from "./hooks/useOrgShell";
import { OrgShellContext } from "./OrgShellContext";
import { useOrgPrimaryColor } from "./hooks/useOrgPrimaryColor";
import { PageLoading } from "@/ui/PageLoading";

export function OrgLayout() {
  const { orgSlug } = useParams();
  const auth = useOutletContext<AuthedOutletContext>();
  const shell = useOrgShellData(orgSlug);
  useOrgPrimaryColor(shell.value.organization?.accentColor);

  if (shell.loading) {
    return <PageLoading fullScreen label="Loading organization…" />;
  }

  if (shell.notFound || !shell.value.organization || !shell.value.role) {
    return <OrgNotFound error={shell.error} />;
  }

  return (
    <OrgShellContext.Provider value={shell.value}>
      <Outlet context={auth} />
    </OrgShellContext.Provider>
  );
}
