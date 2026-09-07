import { Outlet, useOutletContext } from "react-router-dom";
import type { AuthedOutletContext } from "@/auth/hooks/useAuthedUser";

/** No org sidebar or top bar — print screens. Org context comes from OrgLayout. */
export function PrintLayout() {
  const auth = useOutletContext<AuthedOutletContext>();
  return <Outlet context={auth} />;
}
