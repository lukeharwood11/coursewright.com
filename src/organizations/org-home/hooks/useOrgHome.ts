import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { firstNameFrom } from "@/auth/model/displayName";
import {
  getMembershipByOrgSlug,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { loadParentDashboard, parentQueryKeys } from "@/parent/databridge/dashboard";
import { isStaffRole } from "@/organizations/model/role";

export function useOrgHome(orgSlug: string | undefined) {
  const user = useAuthedUser();

  const membershipQuery = useQuery({
    queryKey: orgQueryKeys.bySlug(orgSlug ?? "", user.id),
    queryFn: () => getMembershipByOrgSlug(user.id, orgSlug ?? ""),
    enabled: Boolean(orgSlug),
  });

  const profileQuery = useQuery({
    queryKey: ["profiles", user.id],
    queryFn: () => getProfile(user.id),
  });

  const organization = membershipQuery.data?.organization ?? null;
  const role = membershipQuery.data?.role ?? null;
  const parentView = role === "parent";

  const dashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(organization?.id ?? 0, user.id),
    queryFn: () => loadParentDashboard(organization!.id, user.id),
    enabled: parentView && Boolean(organization),
  });

  const profileName = profileQuery.data?.name ?? "";
  const profileEmail = profileQuery.data?.email ?? user.email ?? "";

  return {
    loading: membershipQuery.isLoading,
    error: membershipQuery.error ? membershipQuery.error.message : null,
    notFound: !membershipQuery.isLoading && !membershipQuery.data,
    organization,
    role,
    isStaff: role ? isStaffRole(role) : false,
    firstName: firstNameFrom(profileName, profileEmail),
    profileName,
    profileEmail,
    dashboard: dashboardQuery.data ?? null,
    dashboardLoading: parentView && dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error ? dashboardQuery.error.message : null,
  };
}
