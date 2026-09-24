import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, profileQueryKeys } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { courseQueryKeys, listCourses } from "@/courses/databridge/courses";
import {
  discussionQueryKeys,
  listDiscussionsForOrganization,
} from "@/discussions/databridge/discussions";
import { subscribeToOrgDiscussions } from "@/discussions/databridge/realtime";
import { countUnreadDiscussions } from "@/discussions/model/unread";
import { notificationQueryKeys } from "@/notifications/databridge/notifications";
import { subscribeToOrgNotifications } from "@/notifications/databridge/realtime";
import { getOrganizationFeatures } from "@/organizations/databridge/features";
import {
  getMembershipByOrgSlug,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { DEFAULT_ORG_FEATURES } from "@/organizations/model/features";
import { isStaffRole } from "@/organizations/model/role";
import { loadParentDashboard, parentQueryKeys } from "@/parent/databridge/dashboard";
import { orgHasVisibleResources } from "@/resources/databridge/folders";
import { resourceItemQueryKeys } from "@/resources/databridge/items";
import {
  classQueryKeys,
  listClasses,
} from "@/roster/databridge/classes";
import { studentsHubTier } from "@/grading/model/access";
import { buildLearnerNav, buildParentNav, buildStaffNav } from "../model/nav";
import {
  canUseStaffViewToggle,
  familyVisibleCourses,
  staffShowsParentPresentation,
} from "../model/viewMode";
import type { AppShellValue } from "../OrgShellContext";
import { useStaffViewMode } from "../stores/viewMode";

export function useOrgShellData(orgSlug: string | undefined) {
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const { staffViewMode, setStaffViewMode } = useStaffViewMode(orgSlug);

  const membershipQuery = useQuery({
    queryKey: orgQueryKeys.bySlug(orgSlug ?? "", user.id),
    queryFn: () => getMembershipByOrgSlug(user.id, orgSlug ?? ""),
    enabled: Boolean(orgSlug),
  });

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const baseOrganization = membershipQuery.data?.organization ?? null;
  const role = membershipQuery.data?.role ?? null;
  const isStaff = role ? isStaffRole(role) : false;
  const organizationId = baseOrganization?.id;

  const featuresQuery = useQuery({
    queryKey: orgQueryKeys.features(organizationId ?? 0),
    queryFn: () => getOrganizationFeatures(organizationId!),
    enabled: Boolean(organizationId),
  });

  const features = featuresQuery.data ?? DEFAULT_ORG_FEATURES;
  const organization = baseOrganization
    ? { ...baseOrganization, features }
    : null;

  const parentPresentation = staffShowsParentPresentation(role, staffViewMode);
  const showStaffViewToggle = canUseStaffViewToggle(role);

  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organizationId ?? 0),
    queryFn: () => listCourses(organizationId!),
    enabled: Boolean(organizationId),
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organizationId ?? 0),
    queryFn: () => listClasses(organizationId!),
    enabled: isStaff && Boolean(organizationId) && !parentPresentation,
  });

  const parentDashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(organizationId ?? 0, user.id),
    queryFn: () => loadParentDashboard(organizationId!, user.id),
    enabled: parentPresentation && Boolean(organizationId),
  });

  const discussionsQuery = useQuery({
    queryKey: discussionQueryKeys.org(organizationId ?? 0, user.id),
    queryFn: () => listDiscussionsForOrganization(organizationId!, user.id),
    enabled: Boolean(organizationId) && Boolean(organization?.features.discussions),
  });

  useEffect(() => {
    if (!organizationId || !organization?.features.discussions) return;
    return subscribeToOrgDiscussions(organizationId, () => {
      void queryClient.invalidateQueries({
        queryKey: discussionQueryKeys.org(organizationId, user.id),
      });
    });
  }, [organizationId, organization?.features.discussions, user.id, queryClient]);

  useEffect(() => {
    if (!organizationId) return;
    return subscribeToOrgNotifications(organizationId, user.id, () => {
      void queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.org(organizationId, user.id),
      });
    });
  }, [organizationId, user.id, queryClient]);

  const courseRows = Array.isArray(coursesQuery.data) ? coursesQuery.data : [];
  const navCourses = parentPresentation
    ? familyVisibleCourses(courseRows)
    : courseRows;

  const lists = {
    courses: navCourses.map((course) => ({
      id: String(course.id),
      title: course.title,
    })),
    classes: (classesQuery.data ?? []).map((classGroup) => ({
      id: String(classGroup.id),
      title: classGroup.title,
    })),
  };

  const unreadAnnouncements = organization?.features.announcements
    ? (parentDashboardQuery.data?.announcements ?? []).filter((item) => !item.read).length
    : 0;
  const unreadDiscussions = organization?.features.discussions
    ? countUnreadDiscussions(discussionsQuery.data ?? [])
    : 0;

  const visibleResourcesQuery = useQuery({
    queryKey: resourceItemQueryKeys.visible(organizationId ?? 0),
    queryFn: () => orgHasVisibleResources(organizationId!),
    enabled:
      parentPresentation &&
      Boolean(organizationId) &&
      Boolean(organization?.features.resources),
  });

  const featureFlags = organization
    ? {
        calendar: organization.features.calendar,
        announcements: organization.features.announcements,
        discussions: organization.features.discussions,
        resources: organization.features.resources,
      }
    : undefined;

  const hubTier = studentsHubTier(role, parentPresentation);
  const navOptions = {
    ...featureFlags,
    unreadAnnouncements,
    unreadDiscussions,
    showResources: Boolean(visibleResourcesQuery.data),
  };
  const navSections =
    organization && role
      ? hubTier === "learner"
        ? buildLearnerNav(organization.slug, lists, navOptions)
        : hubTier === "view"
          ? buildParentNav(organization.slug, lists, navOptions)
          : buildStaffNav(organization.slug, lists, {
              ...featureFlags,
              unreadDiscussions,
            })
      : [];

  const profileName = profileQuery.data?.name ?? "";
  const profileEmail = profileQuery.data?.email ?? user.email ?? "";

  const value: AppShellValue = {
    brandLabel: organization?.name ?? "Course Wright",
    brandHref: organization ? `/my/${organization.slug}` : "/my",
    navLabel: "Organization",
    organization,
    role,
    isParent: Boolean(membershipQuery.data?.isParent),
    isStudent: Boolean(membershipQuery.data?.isStudent),
    profileName,
    profileEmail,
    navSections,
    showSearch: isStaff && !parentPresentation,
    parentPresentation,
    showStaffViewToggle,
    staffViewMode,
    setStaffViewMode,
  };

  return {
    loading: membershipQuery.isLoading,
    error: membershipQuery.error ? membershipQuery.error.message : null,
    notFound: !membershipQuery.isLoading && !membershipQuery.data,
    value,
  };
}
