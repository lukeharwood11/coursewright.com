import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getProfile, profileQueryKeys } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { firstNameFrom } from "@/auth/model/displayName";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { browsesAsStaff } from "@/organizations/model/role";
import {
  loadStaffDashboard,
  staffDashboardQueryKey,
} from "@/organizations/databridge/staffDashboard";
import {
  loadDashboardForStaffViewMode,
  loadParentDashboard,
  parentQueryKeys,
  type FamilyDashboardScope,
} from "@/parent/databridge/dashboard";
import {
  parseOrgHomeWeekSearch,
  resolveOrgHomeWeek,
} from "@/parent/model/orgHomeWeek";
import { isCurrentCalendarWeek, shiftCalendarWeek } from "@/parent/model/thisWeek";
import { useMemo } from "react";

function familyScopeForMode(
  staffViewMode: "teacher" | "preview" | "parent" | "student",
  parentPresentation: boolean,
  browsesStaff: boolean,
): FamilyDashboardScope {
  if (browsesStaff && parentPresentation) {
    if (staffViewMode === "parent") return "parent";
    if (staffViewMode === "student") return "student";
    return "preview";
  }
  return "family";
}

export function useOrgHome() {
  const user = useAuthedUser();
  const { organization, role, parentPresentation, staffViewMode } = useOrgShell();
  const staffView = browsesAsStaff(role);
  const scope = familyScopeForMode(staffViewMode, parentPresentation, staffView);
  const [search, setSearch] = useSearchParams();
  const weekStartParam = parseOrgHomeWeekSearch(search.toString());
  const week = useMemo(
    () => resolveOrgHomeWeek(weekStartParam),
    [weekStartParam],
  );
  const isCurrentWeek = isCurrentCalendarWeek(week);

  function setWeekStart(next: string | null) {
    const params = new URLSearchParams(search);
    if (next) params.set("week", next);
    else params.delete("week");
    setSearch(params, { replace: true });
  }

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const profileName = profileQuery.data?.name ?? "";
  const profileEmail = profileQuery.data?.email ?? user.email ?? "";
  const firstName = firstNameFrom(profileName, profileEmail);

  const dashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(
      organization.id,
      user.id,
      scope,
      weekStartParam,
    ),
    queryFn: () => {
      const options = { weekStart: weekStartParam };
      if (staffView && parentPresentation) {
        return loadDashboardForStaffViewMode(
          organization.id,
          user.id,
          staffViewMode === "teacher" ? "preview" : staffViewMode,
          firstName || "Preview",
          options,
        );
      }
      return loadParentDashboard(organization.id, user.id, options);
    },
    enabled: parentPresentation,
  });

  const staffDashboardQuery = useQuery({
    queryKey: staffDashboardQueryKey(organization.id),
    queryFn: () => loadStaffDashboard(organization.id),
    enabled: staffView && !parentPresentation,
  });

  const dashboard = dashboardQuery.data ?? null;
  const isInstructorPreview = staffView && staffViewMode === "preview";
  const parentViewIsPreview =
    isInstructorPreview ||
    (parentPresentation &&
      staffView &&
      (staffViewMode === "parent" || staffViewMode === "student") &&
      dashboard != null &&
      dashboard.students.length === 0);

  return {
    organization,
    role,
    parentPresentation,
    staffViewMode,
    parentViewIsPreview,
    isInstructorPreview,
    firstName,
    dashboard,
    dashboardLoading: parentPresentation && dashboardQuery.isLoading,
    dashboardError: dashboardQuery.error ? dashboardQuery.error.message : null,
    staffDashboard: staffDashboardQuery.data ?? null,
    staffDashboardLoading: staffView && !parentPresentation && staffDashboardQuery.isLoading,
    staffDashboardError: staffDashboardQuery.error
      ? staffDashboardQuery.error.message
      : null,
    week,
    weekStartParam,
    isCurrentWeek,
    goPrevWeek: () => setWeekStart(shiftCalendarWeek(week.start, -1)),
    goNextWeek: () => setWeekStart(shiftCalendarWeek(week.start, 1)),
    goThisWeek: () => setWeekStart(null),
  };
}
