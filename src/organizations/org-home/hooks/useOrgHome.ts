import { useQuery } from "@tanstack/react-query";
import { getProfile, profileQueryKeys } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { firstNameFrom } from "@/auth/model/displayName";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { isStaffRole } from "@/organizations/model/role";
import {
  loadStaffDashboard,
  staffDashboardQueryKey,
} from "@/organizations/databridge/staffDashboard";
import { loadParentDashboard, parentQueryKeys } from "@/parent/databridge/dashboard";

export function useOrgHome() {
  const user = useAuthedUser();
  const { organization, role, parentPresentation } = useOrgShell();
  const staffView = isStaffRole(role);

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const dashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(organization.id, user.id),
    queryFn: () => loadParentDashboard(organization.id, user.id),
    enabled: parentPresentation,
  });

  const staffDashboardQuery = useQuery({
    queryKey: staffDashboardQueryKey(organization.id),
    queryFn: () => loadStaffDashboard(organization.id),
    enabled: staffView && !parentPresentation,
  });

  const profileName = profileQuery.data?.name ?? "";
  const profileEmail = profileQuery.data?.email ?? user.email ?? "";
  const dashboard = dashboardQuery.data ?? null;
  const parentViewIsPreview =
    parentPresentation && staffView && dashboard != null && dashboard.students.length === 0;

  return {
    organization,
    role,
    parentPresentation,
    parentViewIsPreview,
    firstName: firstNameFrom(profileName, profileEmail),
    dashboard,
    dashboardLoading: parentPresentation && dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error ? dashboardQuery.error.message : null,
    staffDashboard: staffDashboardQuery.data ?? null,
    staffDashboardLoading: staffView && !parentPresentation && staffDashboardQuery.isLoading,
    staffDashboardError: staffDashboardQuery.error
      ? staffDashboardQuery.error.message
      : null,
  };
}
