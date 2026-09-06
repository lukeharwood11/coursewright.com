import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isStaffRole } from "@/organizations/model/role";
import { useOrgShell } from "@/app/layouts/OrgShellContext";

/** UX gate — RLS is the real access control. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { organization, role } = useOrgShell();
  if (!isStaffRole(role)) {
    return <Navigate to={`/my/${organization.slug}`} replace />;
  }
  return children;
}
