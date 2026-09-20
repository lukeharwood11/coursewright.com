import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  getOrgPersonProfile,
  orgPersonQueryKeys,
} from "@/organizations/databridge/people";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useUserProfile() {
  const { userId: userIdParam } = useParams();
  const userId = userIdParam ?? "";
  const { organization, role } = useOrgShell();
  const validId = UUID_RE.test(userId);

  const query = useQuery({
    queryKey: orgPersonQueryKeys.profile(organization.id, userId),
    queryFn: () => getOrgPersonProfile(organization.id, userId),
    enabled: validId,
  });

  return {
    organization,
    role,
    userId,
    profile: query.data ?? null,
    loading: validId && query.isLoading,
    error: query.error?.message ?? null,
    notFound: !validId || (!query.isLoading && !query.data),
  };
}
