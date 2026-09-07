import { Outlet, useOutletContext } from "react-router-dom";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";
import { AppShellFrame } from "./components/AppShellFrame";

export function OrgChrome() {
  const auth = useOutletContext<AuthedOutletContext>();
  return (
    <AppShellFrame>
      <Outlet context={auth} />
    </AppShellFrame>
  );
}
