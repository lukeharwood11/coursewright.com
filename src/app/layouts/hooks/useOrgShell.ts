import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, profileQueryKeys } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { firstNameFrom } from "@/auth/model/displayName";
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
import { browsesAsStaff } from "@/organizations/model/role";
import {
  loadDashboardForStaffViewMode,
  loadParentDashboard,
  listTaughtPublishedCourses,
  parentQueryKeys,
  type FamilyDashboardScope,
} from "@/parent/databridge/dashboard";
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

function dashboardScope(
  staffViewMode: AppShellValue["staffViewMode"],
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

export function useOrgShellData(orgSlug: string | undefined) {
  const user = useAuthedUser();
  const queryClient = useQueryClient();

  const membershipQuery = useQuery({
    queryKey: orgQueryKeys.bySlug(orgSlug ?? "", user.id),
    queryFn: () => getMembershipByOrgSlug(user.id, orgSlug ?? ""),
    enabled: Boolean(orgSlug),
  });

  const isParent = Boolean(membershipQuery.data?.isParent);
  const isStudent = Boolean(membershipQuery.data?.isStudent);
  const { staffViewMode, setStaffViewMode } = useStaffViewMode(orgSlug, {
    isParent,
    isStudent,
  });

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const baseOrganization = membershipQuery.data?.organization ?? null;
  const role = membershipQuery.data?.role ?? null;
  const browsesStaff = role ? browsesAsStaff(role) : false;
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
  const scope = dashboardScope(staffViewMode, parentPresentation, browsesStaff);

  const profileName = profileQuery.data?.name ?? "";
  const profileEmail = profileQuery.data?.email ?? user.email ?? "";
  const firstName = firstNameFrom(profileName, profileEmail);

  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organizationId ?? 0),
    queryFn: () => listCourses(organizationId!),
    enabled: Boolean(organizationId),
  });

  const taughtCoursesQuery = useQuery({
    queryKey: parentQueryKeys.taughtCourses(organizationId ?? 0, user.id),
    queryFn: () => listTaughtPublishedCourses(organizationId!, user.id),
    enabled: Boolean(organizationId) && browsesStaff && staffViewMode === "preview",
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organizationId ?? 0),
    queryFn: () => listClasses(organizationId!),
    enabled: browsesStaff && Boolean(organizationId) && !parentPresentation,
  });

  const parentDashboardQuery = useQuery({
    queryKey: parentQueryKeys.dashboard(organizationId ?? 0, user.id, scope),
    queryFn: () => {
      if (browsesStaff && parentPresentation) {
        return loadDashboardForStaffViewMode(
          organizationId!,
          user.id,
          staffViewMode === "teacher" ? "preview" : staffViewMode,
          firstName || "Preview",
        );
      }
      return loadParentDashboard(organizationId!, user.id);
    },
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
  let navCourses = parentPresentation
    ? familyVisibleCourses(courseRows)
    : courseRows;

  if (staffViewMode === "preview" && browsesStaff) {
    const taughtIds = new Set((taughtCoursesQuery.data ?? []).map((row) => row.id));
    navCourses = familyVisibleCourses(courseRows).filter((course) =>
      taughtIds.has(course.id),
    );
  } else if (
    parentPresentation &&
    browsesStaff &&
    (staffViewMode === "parent" || staffViewMode === "student")
  ) {
    const enrolledIds = new Set(
      (parentDashboardQuery.data?.courses ?? []).map((course) => course.id),
    );
    navCourses = familyVisibleCourses(courseRows).filter((course) =>
      enrolledIds.has(course.id),
    );
  }

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
    queryKey: resourceItemQueryKeys.hasVisible(organizationId ?? 0),
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

  // Parent tab uses family Students hub; Preview/Student use learner Progress
  // (Preview omits Progress — no linked student account).
  const hubTier =
    browsesStaff && staffViewMode === "parent"
      ? "view"
      : studentsHubTier(role, parentPresentation);
  const navOptions = {
    ...featureFlags,
    unreadAnnouncements,
    unreadDiscussions,
    showResources: Boolean(visibleResourcesQuery.data),
    showProgress: !(browsesStaff && staffViewMode === "preview"),
  };
  const staffChrome = browsesStaff && !parentPresentation;
  const navSections =
    organization && role
      ? staffChrome
        ? buildStaffNav(organization.slug, lists, {
            ...featureFlags,
            unreadDiscussions,
          })
        : hubTier === "learner"
          ? buildLearnerNav(organization.slug, lists, navOptions)
          : buildParentNav(organization.slug, lists, navOptions)
      : [];

  const value: AppShellValue = {
    brandLabel: organization?.name ?? "Course Wright",
    brandHref: organization ? `/my/${organization.slug}` : "/my",
    navLabel: "Organization",
    organization,
    role,
    isParent,
    isStudent,
    profileName,
    profileEmail,
    navSections,
    showSearch: Boolean(organization),
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
