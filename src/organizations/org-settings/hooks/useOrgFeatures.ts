import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { caughtErrorMessage } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  getOrganizationFeatures,
  saveOrganizationFeatures,
} from "@/organizations/databridge/features";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import {
  DEFAULT_ORG_FEATURES,
  sameOrgFeatures,
  toggleOrgFeature,
  type OrgFeatureKey,
  type OrgFeatures,
} from "@/organizations/model/features";

export function useOrgFeatures(organizationId: number | undefined) {
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const featuresQuery = useQuery({
    queryKey: orgQueryKeys.features(organizationId ?? 0),
    queryFn: () => getOrganizationFeatures(organizationId!),
    enabled: Boolean(organizationId),
  });

  const saved = featuresQuery.data ?? DEFAULT_ORG_FEATURES;
  const [draft, setDraft] = useState<OrgFeatures>(saved);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(saved);
    setFormError(null);
  }, [saved]);

  async function refresh() {
    if (!organizationId) return;
    await queryClient.invalidateQueries({
      queryKey: orgQueryKeys.features(organizationId),
    });
    await queryClient.invalidateQueries({
      queryKey: orgQueryKeys.memberships(user.id),
    });
    await queryClient.invalidateQueries({
      queryKey: orgQueryKeys.detail(organizationId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["organizations", "slug"],
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Organization isn’t loaded yet.");
      await saveOrganizationFeatures({ organizationId, features: draft });
    },
    onSuccess: async () => {
      setFormError(null);
      await refresh();
      toast("Customizations saved.");
    },
    onError: (error: Error) => {
      setFormError(caughtErrorMessage(error));
    },
  });

  function onToggle(key: OrgFeatureKey) {
    setFormError(null);
    setDraft((current) => toggleOrgFeature(current, key));
  }

  return {
    loading: featuresQuery.isLoading,
    loadError: featuresQuery.error instanceof Error ? featuresQuery.error.message : null,
    features: draft,
    formError,
    hasChanges: !sameOrgFeatures(draft, saved),
    saving: saveMutation.isPending,
    onToggle,
    onSave: () => saveMutation.mutate(),
  };
}
