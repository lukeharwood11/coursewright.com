import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { canManageOrgSettings } from "@/organizations/model/role";
import {
  deleteRatingOption,
  insertRatingOption,
  listRatingOptions,
  outcomeQueryKeys,
  updateRatingOption,
} from "@/outcomes/databridge/outcomes";
import {
  nextSortOrder,
  normalizeOutcomeText,
  sortOrdersForIds,
  validateRatingLabel,
  type RatingOption,
} from "@/outcomes/model/outcomes";

export function useRatingOptions() {
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const canEdit = canManageOrgSettings(role);

  const optionsQuery = useQuery({
    queryKey: outcomeQueryKeys.ratingOptions(organization.id),
    queryFn: () => listRatingOptions(organization.id),
  });

  function invalidate() {
    return queryClient.invalidateQueries({
      queryKey: outcomeQueryKeys.ratingOptions(organization.id),
    });
  }

  const add = useMutation({
    mutationFn: (input: { label: string; sortOrder: number }) =>
      insertRatingOption({
        organizationId: organization.id,
        label: input.label,
        sortOrder: input.sortOrder,
      }),
    onSuccess: async () => {
      setFormError(null);
      await invalidate();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const saveLabel = useMutation({
    mutationFn: async (input: { id: number; label: string }) => {
      const options = optionsQuery.data ?? [];
      const error = validateRatingLabel(input.label, options, input.id);
      if (error) throw new Error(error);
      await updateRatingOption({
        id: input.id,
        label: normalizeOutcomeText(input.label),
      });
    },
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: (input: { id: number; isActive: boolean }) =>
      updateRatingOption({ id: input.id, isActive: input.isActive }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteRatingOption(id),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(
        sortOrdersForIds(ids).map((row) =>
          updateRatingOption({ id: row.id, sortOrder: row.sortOrder }),
        ),
      );
    },
    onSuccess: invalidate,
  });

  function move(option: RatingOption, direction: -1 | 1) {
    const options = optionsQuery.data ?? [];
    const index = options.findIndex((row) => row.id === option.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= options.length) return;
    const ids = options.map((row) => row.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(next, 0, moved);
    reorder.mutate(ids);
  }

  const error =
    optionsQuery.error instanceof Error
      ? optionsQuery.error.message
      : saveLabel.error instanceof Error
        ? saveLabel.error.message
        : setActive.error instanceof Error
          ? setActive.error.message
          : remove.error instanceof Error
            ? remove.error.message
            : reorder.error instanceof Error
              ? reorder.error.message
              : null;

  return {
    options: optionsQuery.data ?? [],
    loading: optionsQuery.isLoading,
    canEdit,
    formError,
    error,
    saving: add.isPending || saveLabel.isPending || reorder.isPending,
    addOption: (label: string, onSaved?: () => void) => {
      const options = optionsQuery.data ?? [];
      const error = validateRatingLabel(label, options);
      if (error) {
        setFormError(error);
        return;
      }
      setFormError(null);
      add.mutate(
        { label: normalizeOutcomeText(label), sortOrder: nextSortOrder(options) },
        { onSuccess: () => onSaved?.() },
      );
    },
    saveLabel: (id: number, label: string) => saveLabel.mutate({ id, label }),
    setActive: (id: number, isActive: boolean) => setActive.mutate({ id, isActive }),
    removeOption: (id: number) => remove.mutate(id),
    moveUp: (option: RatingOption) => move(option, -1),
    moveDown: (option: RatingOption) => move(option, 1),
  };
}
