import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { listCourses, courseQueryKeys } from "@/courses/databridge/courses";
import {
  getMembershipByOrgSlug,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { isStaffRole } from "@/organizations/model/role";
import { familyLabel, familyMemberNames } from "@/roster/model/family";
import {
  familyQueryKeys,
  listFamilies,
} from "@/roster/databridge/families";
import {
  classQueryKeys,
  listClasses,
} from "@/roster/databridge/classes";
import { buildParentNav, buildStaffNav } from "../model/nav";

export function useOrgShellData(orgSlug: string | undefined) {
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
  const isStaff = role ? isStaffRole(role) : false;
  const organizationId = organization?.id;

  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organizationId ?? 0),
    queryFn: () => listCourses(organizationId!),
    enabled: Boolean(organizationId),
  });

  const classesQuery = useQuery({
    queryKey: classQueryKeys.list(organizationId ?? 0),
    queryFn: () => listClasses(organizationId!),
    enabled: isStaff && Boolean(organizationId),
  });

  const familiesQuery = useQuery({
    queryKey: familyQueryKeys.list(organizationId ?? 0),
    queryFn: () => listFamilies(organizationId!),
    enabled: isStaff && Boolean(organizationId),
  });

  const lists = {
    courses: (coursesQuery.data ?? []).map((course) => ({
      id: String(course.id),
      title: course.title,
    })),
    classes: (classesQuery.data ?? []).map((classGroup) => ({
      id: String(classGroup.id),
      title: classGroup.title,
    })),
    families: (familiesQuery.data ?? []).map((family) => ({
      id: String(family.id),
      label: familyLabel(
        family.displayName,
        familyMemberNames(
          family.students.map((member) => member.student),
          family.parents,
        ),
      ),
    })),
  };

  const navSections =
    organization && role
      ? isStaff
        ? buildStaffNav(organization.slug, lists)
        : buildParentNav(organization.slug, lists)
      : [];

  const profileName = profileQuery.data?.name ?? "";
  const profileEmail = profileQuery.data?.email ?? user.email ?? "";

  return {
    loading: membershipQuery.isLoading,
    error: membershipQuery.error ? membershipQuery.error.message : null,
    notFound: !membershipQuery.isLoading && !membershipQuery.data,
    brandLabel: organization?.name ?? "Course Wright",
    brandHref: organization ? `/my/${organization.slug}` : "/my",
    navLabel: "Organization",
    organization,
    role,
    profileName,
    profileEmail,
    navSections,
    showSearch: isStaff,
  };
}
