import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastCaughtError } from "@/ui/toast";
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
import { DEFAULT_SCHOOL_DAYS, sameSchoolDays, toggleSchoolDay, type SchoolDay } from "@/organizations/model/schoolDays";
import { formatSlugInput } from "@/organizations/model/slug";
import {
  orgSettingsHaveChanges,
  validateUpdateOrganization,
} from "@/organizations/model/updateOrganization";

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
  const organizationId = membership?.organization.id;

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organizationId ?? 0),
    queryFn: () => getOrganization(organizationId!),
    enabled: Boolean(organizationId),
  });

  const organization = organizationQuery.data ?? null;
  const role = membership?.role ?? null;
  const canEdit = role ? canManageOrgSettings(role) : false;
  const showBilling = role ? canManageBilling(role) : false;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgType, setOrgType] = useState("other");
  const [gradeScheme, setGradeScheme] = useState("k12");
  const [gradeLabelsText, setGradeLabelsText] = useState("");
  const [schoolDays, setSchoolDays] = useState<SchoolDay[]>(DEFAULT_SCHOOL_DAYS);
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPermalinkChange, setConfirmPermalinkChange] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    if (!organization) return;
    setName(organization.name);
    setSlug(organization.slug);
    setOrgType(organization.orgType);
    setGradeScheme(organization.gradeScheme);
    setGradeLabelsText(gradeLabelsToText(organization.gradeLabels));
    setSchoolDays(organization.schoolDays);
    setAbout(organization.about ?? "");
    setAddress(organization.address ?? "");
    setWebsite(organization.website ?? "");
    setContactEmail(organization.contactEmail ?? "");
    setPhone(organization.phone ?? "");
    setConfirmPermalinkChange(false);
    setFormError(null);
  }, [organization]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

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
        schoolDays,
        about,
        address,
        website,
        contactEmail,
        phone,
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
      toastCaughtError(error);
    },
  });

  function onNameChange(value: string) {
    setName(value);
    setFormError(null);
  }

  function onSlugChange(value: string) {
    setSlug(formatSlugInput(value));
    setConfirmPermalinkChange(false);
    setFormError(null);
  }

  function onToggleSchoolDay(day: SchoolDay) {
    const next = toggleSchoolDay(schoolDays, day);
    if (sameSchoolDays(next, schoolDays) && schoolDays.includes(day)) {
      toast("Choose at least one school day.");
      return;
    }
    setSchoolDays(next);
    setFormError(null);
  }

  const slugChanged = Boolean(organization && slug !== organization.slug);
  const hasChanges = organization
    ? orgSettingsHaveChanges(
        {
          name,
          slug,
          orgType,
          gradeScheme,
          gradeLabelsText,
          schoolDays,
          about,
          address,
          website,
          contactEmail,
          phone,
        },
        organization,
      )
    : false;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canEdit || !hasChanges) return;
    setFormError(null);
    saveMutation.mutate();
  }

  function onCancel() {
    resetForm();
  }

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
    schoolDays,
    about,
    address,
    website,
    contactEmail,
    phone,
    confirmPermalinkChange,
    slugChanged,
    hasChanges,
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
    onToggleSchoolDay,
    onAboutChange: (value: string) => {
      setAbout(value);
      setFormError(null);
    },
    onAddressChange: (value: string) => {
      setAddress(value);
      setFormError(null);
    },
    onWebsiteChange: (value: string) => {
      setWebsite(value);
      setFormError(null);
    },
    onContactEmailChange: (value: string) => {
      setContactEmail(value);
      setFormError(null);
    },
    onPhoneChange: (value: string) => {
      setPhone(value);
      setFormError(null);
    },
    onConfirmPermalinkChange: (value: boolean) => {
      setConfirmPermalinkChange(value);
      setFormError(null);
    },
    onSubmit,
    onCancel,
  };
}
