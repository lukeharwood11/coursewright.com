import { useQuery } from "@tanstack/react-query";
import { getProfile, profileQueryKeys } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  listMyMemberships,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { buildAccountNav } from "../model/nav";
import type { AppShellValue } from "../OrgShellContext";

export function useAccountShellData(): AppShellValue {
  const user = useAuthedUser();

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const membershipsQuery = useQuery({
    queryKey: orgQueryKeys.memberships(user.id),
    queryFn: () => listMyMemberships(user.id),
  });

  const organizations = (membershipsQuery.data ?? []).map(
    (membership) => membership.organization,
  );

  return {
    brandLabel: "Course Wright",
    brandHref: "/my",
    navLabel: "Account",
    organization: null,
    role: null,
    profileName: profileQuery.data?.name ?? "",
    profileEmail: profileQuery.data?.email ?? user.email ?? "",
    navSections: buildAccountNav(organizations),
    showSearch: false,
  };
}
