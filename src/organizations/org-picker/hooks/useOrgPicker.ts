import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { createOrganization } from "@/organizations/databridge/organizations";
import {
  listMyMemberships,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { validateCreateOrganization } from "@/organizations/model/createOrganization";
import { formatSlugInput } from "@/organizations/model/slug";
import { caughtErrorMessage } from "@/ui/toast";

export function useOrgPicker() {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const membershipsQuery = useQuery({
    queryKey: orgQueryKeys.memberships(user.id),
    queryFn: () => listMyMemberships(user.id),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateCreateOrganization({ name, slug });
      if (!parsed.ok) {
        throw new Error(parsed.error);
      }
      return createOrganization(parsed.value);
    },
    onSuccess: async (org) => {
      await queryClient.invalidateQueries({
        queryKey: orgQueryKeys.memberships(user.id),
      });
      navigate(`/my/${org.slug}`);
    },
    onError: (error: Error) => {
      setFormError(caughtErrorMessage(error));
    },
  });

  function onNameChange(value: string) {
    setName(value);
    setFormError(null);
    if (!slugTouched) setSlug(formatSlugInput(value));
  }

  function onSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(formatSlugInput(value));
    setFormError(null);
  }

  function onCreate(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    createMutation.mutate();
  }

  return {
    memberships: membershipsQuery.data ?? [],
    loading: membershipsQuery.isLoading,
    loadError: membershipsQuery.error
      ? membershipsQuery.error.message
      : null,
    name,
    slug,
    formError,
    creating: createMutation.isPending,
    onNameChange,
    onSlugChange,
    onCreate,
  };
}
