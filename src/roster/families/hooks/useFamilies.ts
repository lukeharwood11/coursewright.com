import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  createFamily,
  familyQueryKeys,
  listFamilies,
} from "@/roster/databridge/families";
import {
  familyCountSummary,
  familyLabel,
  familyMemberNames,
  validateFamily,
} from "@/roster/model/family";

export function useFamilies() {
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: familyQueryKeys.list(organization.id),
    queryFn: () => listFamilies(organization.id),
  });

  const [displayName, setDisplayName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateFamily({ displayName });
      if (!parsed.ok) throw new Error(parsed.error);
      return createFamily(organization.id, parsed.value);
    },
    onSuccess: async (family) => {
      setDisplayName("");
      setCreateError(null);
      await queryClient.invalidateQueries({
        queryKey: familyQueryKeys.list(organization.id),
      });
      toast("Family created.");
      navigate(`/my/${organization.slug}/families/${family.id}`);
    },
    onError: (error: Error) => {
      setCreateError(error.message);
    },
  });

  function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreateError(null);
    createMutation.mutate();
  }

  return {
    organization,
    families: (query.data ?? []).map((family) => ({
      id: family.id,
      label: familyLabel(
        family.displayName,
        familyMemberNames(family.students.map((member) => member.student)),
      ),
      summary: familyCountSummary(family.students.length, family.parents.length),
    })),
    loading: query.isLoading,
    error: query.error ? query.error.message : null,
    displayName,
    createError,
    creating: createMutation.isPending,
    setDisplayName: (value: string) => {
      setDisplayName(value);
      setCreateError(null);
    },
    onCreate,
  };
}
