import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfile,
  profileQueryKeys,
  updateProfile,
} from "@/auth/api/profiles";
import { signOut } from "@/auth/api/session";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { profileHaveChanges, validateProfile } from "@/auth/model/profile";

export const ACCOUNT_PROFILE_FORM_ID = "account-profile-form";

export function useAccountSettings() {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const profile = profileQuery.data ?? null;
  const email = profile?.email ?? user.email ?? "";

  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const resetForm = useCallback(() => {
    setName(profile?.name ?? "");
    setFormError(null);
  }, [profile]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateProfile({ name });
      if (!parsed.ok) throw new Error(parsed.error);
      return updateProfile(user.id, parsed.value);
    },
    onSuccess: async (saved) => {
      setFormError(null);
      queryClient.setQueryData(profileQueryKeys.detail(user.id), saved);
      await queryClient.invalidateQueries({
        queryKey: profileQueryKeys.detail(user.id),
      });
      toast("Account saved.");
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const hasChanges = profileHaveChanges({ name }, profile?.name ?? "");

  function onNameChange(value: string) {
    setName(value);
    setFormError(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges) return;
    setFormError(null);
    saveMutation.mutate();
  }

  async function onSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    const result = await signOut();
    if (result.error) {
      setSignOutError(result.error);
      setSigningOut(false);
      return;
    }
    navigate("/login", { replace: true });
  }

  return {
    loading: profileQuery.isLoading,
    loadError: profileQuery.error ? profileQuery.error.message : null,
    email,
    name,
    formError,
    signOutError,
    saving: saveMutation.isPending,
    signingOut,
    hasChanges,
    onNameChange,
    onSubmit,
    onSignOut,
  };
}
