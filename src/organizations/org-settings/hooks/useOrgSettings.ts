import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  getOrganization,
  updateOrganization,
} from "@/organizations/databridge/organizations";
import {
  getMembershipByOrgSlug,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { gradeLabelsToText, parseGradeLabels } from "@/organizations/model/gradeScheme";
import {
  canManageBilling,
  canManageOrgSettings,
} from "@/organizations/model/role";
import { slugify } from "@/organizations/model/slug";
import { validateUpdateOrganization } from "@/organizations/model/updateOrganization";

export function useOrgSettings(orgSlug: string | undefined) {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const membershipQuery = useQuery({
    queryKey: orgQueryKeys.bySlug(orgSlug ?? "", user.id),
    queryFn: () => getMembershipByOrgSlug(user.id, orgSlug ?? ""),
    enabled: Boolean(orgSlug),
  });

  const membership = membershipQuery.data ?? null;
  const organizationId = membership?.organization.id ?? "";

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organizationId),
    queryFn: () => getOrganization(organizationId),
    enabled: Boolean(organizationId),
  });

  const organization = organizationQuery.data ?? null;
  const role = membership?.role ?? null;
  const canEdit = role ? canManageOrgSettings(role) : false;
  const showBilling = role ? canManageBilling(role) : false;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgType, setOrgType] = useState("coop");
  const [gradeScheme, setGradeScheme] = useState("k12");
  const [gradeLabelsText, setGradeLabelsText] = useState("");
  const [confirmPermalinkChange, setConfirmPermalinkChange] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    setName(organization.name);
    setSlug(organization.slug);
    setOrgType(organization.orgType);
    setGradeScheme(organization.gradeScheme);
    setGradeLabelsText(gradeLabelsToText(organization.gradeLabels));
    setConfirmPermalinkChange(false);
    setFormError(null);
  }, [organization]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organization) {
        throw new Error("Organization isn’t loaded yet.");
      }
      const parsed = validateUpdateOrganization({
        name,
        slug,
        orgType,
        gradeScheme,
        gradeLabels: parseGradeLabels(gradeLabelsText),
        currentSlug: organization.slug,
        confirmPermalinkChange,
      });
      if (!parsed.ok) {
        throw new Error(parsed.error);
      }
      const saved = await updateOrganization(organization.id, parsed.value);
      return { saved, previousSlug: organization.slug };
    },
    onSuccess: async ({ saved, previousSlug }) => {
      setFormError(null);
      setConfirmPermalinkChange(false);
      await queryClient.invalidateQueries({
        queryKey: orgQueryKeys.memberships(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: orgQueryKeys.detail(saved.id),
      });
      await queryClient.invalidateQueries({
        queryKey: orgQueryKeys.bySlug(previousSlug, user.id),
      });
      if (saved.slug !== previousSlug) {
        await queryClient.invalidateQueries({
          queryKey: orgQueryKeys.bySlug(saved.slug, user.id),
        });
        navigate(`/my/${saved.slug}/settings`, { replace: true });
      }
      toast("Organization saved.");
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  function onNameChange(value: string) {
    setName(value);
    setFormError(null);
  }

  function onSlugChange(value: string) {
    setSlug(slugify(value));
    setConfirmPermalinkChange(false);
    setFormError(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    setFormError(null);
    saveMutation.mutate();
  }

  const slugChanged = Boolean(organization && slug !== organization.slug);

  return {
    loading: membershipQuery.isLoading || organizationQuery.isLoading,
    error: membershipQuery.error
      ? membershipQuery.error.message
      : organizationQuery.error
        ? organizationQuery.error.message
        : null,
    notFound:
      !membershipQuery.isLoading &&
      (!membership || (!organizationQuery.isLoading && !organization)),
    role,
    organization,
    canEdit,
    showBilling,
    name,
    slug,
    orgType,
    gradeScheme,
    gradeLabelsText,
    confirmPermalinkChange,
    slugChanged,
    formError,
    saving: saveMutation.isPending,
    onNameChange,
    onSlugChange,
    onOrgTypeChange: (value: string) => {
      setOrgType(value);
      setFormError(null);
    },
    onGradeSchemeChange: (value: string) => {
      setGradeScheme(value);
      setFormError(null);
    },
    onGradeLabelsTextChange: (value: string) => {
      setGradeLabelsText(value);
      setFormError(null);
    },
    onConfirmPermalinkChange: (value: boolean) => {
      setConfirmPermalinkChange(value);
      setFormError(null);
    },
    onSubmit,
  };
}
