import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { familyQueryKeys, getFamily } from "@/roster/databridge/families";
import { familyLabel } from "@/roster/model/familyLabel";

export function useFamily() {
  const { familyId: familyIdParam } = useParams();
  const familyId = familyIdParam ? Number(familyIdParam) : NaN;
  const { organization } = useOrgShell();

  const query = useQuery({
    queryKey: familyQueryKeys.detail(familyId),
    queryFn: () => getFamily(familyId),
    enabled: Number.isFinite(familyId),
  });

  const family = query.data ?? null;
  const belongsHere = family?.organizationId === organization.id;

  return {
    organization,
    family: belongsHere ? family : null,
    title: belongsHere && family ? familyLabel(family.displayName) : null,
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
    notFound: !query.isLoading && (!family || !belongsHere),
  };
}
