import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { getProfile, profileQueryKeys } from "@/auth/api/profiles";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useAppShell } from "@/app/layouts/OrgShellContext";
import { submitFeedback } from "@/feedback/databridge/feedback";
import { validateFeedbackMessage } from "@/feedback/model/validate";
import { roleLabel } from "@/organizations/model/role";

export function useFeedback() {
  const user = useAuthedUser();
  const shell = useAppShell();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: profileQueryKeys.detail(user.id),
    queryFn: () => getProfile(user.id),
  });

  const name = (profileQuery.data?.name || shell.profileName || "").trim();
  const email = profileQuery.data?.email || shell.profileEmail || user.email || "";
  const organization = shell.organization;
  const role = shell.role;

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = validateFeedbackMessage(message);
      if (!parsed.ok) throw new Error(parsed.error);
      if (!email) throw new Error("We couldn’t find your email. Sign out and sign back in.");
      return submitFeedback({
        userId: user.id,
        organizationId: organization?.id ?? null,
        name: name || email,
        email,
        orgName: organization?.name ?? null,
        orgSlug: organization?.slug ?? null,
        role: role ? roleLabel(role) : null,
        pagePath: `${location.pathname}${location.search}`,
        message: parsed.value,
        userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
      });
    },
    onSuccess: () => {
      setMessage("");
      setFormError(null);
      toast("Thanks — we got your note.");
    },
    onError: (error: Error) => setFormError(error.message),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    mutation.mutate();
  }

  return {
    loading: profileQuery.isLoading,
    name: name || "—",
    email: email || "—",
    orgName: organization?.name ?? null,
    orgSlug: organization?.slug ?? null,
    roleLabel: role ? roleLabel(role) : null,
    message,
    setMessage,
    formError,
    submitting: mutation.isPending,
    onSubmit,
  };
}
