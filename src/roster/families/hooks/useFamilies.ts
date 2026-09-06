import { useQuery } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  familyQueryKeys,
  listFamilies,
} from "@/roster/databridge/families";
import { familyLabel } from "@/roster/model/familyLabel";

export function useFamilies() {
  const { organization } = useOrgShell();
  const query = useQuery({
    queryKey: familyQueryKeys.list(organization.id),
    queryFn: () => listFamilies(organization.id),
  });

  return {
    organization,
    families: (query.data ?? []).map((family) => ({
      id: family.id,
      label: familyLabel(family.displayName),
    })),
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
  };
}
