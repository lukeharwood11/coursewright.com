import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { OrgFeatureKey } from "@/organizations/model/features";
import { useOrgShell } from "@/app/layouts/OrgShellContext";

/** UX gate — feature toggles hide product surfaces; RLS still governs data. */
export function RequireOrgFeature({
  feature,
  children,
}: {
  feature: OrgFeatureKey;
  children: ReactNode;
}) {
  const { organization } = useOrgShell();
  if (!organization.features[feature]) {
    return <Navigate to={`/my/${organization.slug}`} replace />;
  }
  return children;
}
