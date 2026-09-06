import { Outlet, useOutletContext } from "react-router-dom";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { AppShellFrame } from "./components/AppShellFrame";
import { useAccountShellData } from "./hooks/useAccountShell";
import { OrgShellContext } from "./OrgShellContext";

export function AccountLayout() {
  const auth = useOutletContext<AuthedOutletContext>();
  const shell = useAccountShellData();

  return (
    <OrgShellContext.Provider value={shell}>
      <AppShellFrame>
        <Outlet context={auth} />
      </AppShellFrame>
    </OrgShellContext.Provider>
  );
}
