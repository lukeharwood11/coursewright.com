import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { caughtErrorMessage } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  clearOrganizationBranding,
  getOrganizationBranding,
  saveOrganizationBranding,
} from "@/organizations/databridge/branding";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import {
  chromeAccentFromHex,
  DEFAULT_CHROME,
  validateAccentInput,
  validateBrandIcon,
  validateBrandLogo,
  type ChromeAccent,
} from "@/organizations/model/brand";

export function useOrgBranding(organizationId: number | undefined) {
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const brandingQuery = useQuery({
    queryKey: orgQueryKeys.branding(organizationId ?? 0),
    queryFn: () => getOrganizationBranding(organizationId!),
    enabled: Boolean(organizationId),
  });

  const saved = brandingQuery.data ?? null;
  const [accentText, setAccentText] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoAccentBackground, setLogoAccentBackground] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function resetDraft() {
    setAccentText(saved?.accentColor ?? "");
    setIconFile(null);
    setRemoveIcon(false);
    setLogoFile(null);
    setRemoveLogo(false);
    setLogoAccentBackground(saved?.logoAccentBackground ?? false);
    setFormError(null);
  }

  useEffect(() => {
    resetDraft();
  }, [
    saved?.accentColor,
    saved?.iconPath,
    saved?.logoPath,
    saved?.logoAccentBackground,
    saved?.updatedAt,
  ]);

  useEffect(() => {
    if (!iconFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(iconFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [iconFile]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const savedAccent = saved?.accentColor ?? "";
  const draftAccent = accentText.trim() === "" ? "" : (parseDraft(accentText) ?? accentText.trim());
  const dirty =
    draftAccent !== savedAccent ||
    iconFile != null ||
    removeIcon ||
    logoFile != null ||
    removeLogo ||
    logoAccentBackground !== (saved?.logoAccentBackground ?? false);
  const accentCheck = validateAccentInput(accentText);
  const accentError = accentText.trim() && !accentCheck.ok ? accentCheck.error : null;

  const preview = previewChrome(accentText);
  const iconUrl = previewUrl ?? (removeIcon ? null : saved?.iconUrl ?? null);
  const logoUrl = logoPreviewUrl ?? (removeLogo ? null : saved?.logoUrl ?? null);
  const draftAccentColor = parseDraft(accentText);

  async function refresh() {
    if (!organizationId) return;
    await queryClient.invalidateQueries({
      queryKey: orgQueryKeys.branding(organizationId),
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
      const accent = validateAccentInput(accentText);
      if (!accent.ok) throw new Error(accent.error);
      let iconExtension = null;
      if (iconFile) {
        const icon = validateBrandIcon(iconFile);
        if (!icon.ok) throw new Error(icon.error);
        iconExtension = icon.extension;
      }
      let logoExtension = null;
      if (logoFile) {
        const logo = validateBrandLogo(logoFile);
        if (!logo.ok) throw new Error(logo.error);
        logoExtension = logo.extension;
      }
      const hasLogo = Boolean(logoFile) || (Boolean(saved?.logoPath) && !removeLogo);
      await saveOrganizationBranding({
        organizationId,
        accentColor: accent.value,
        iconFile,
        iconExtension,
        removeIcon: removeIcon && !iconFile,
        currentIconPath: saved?.iconPath ?? null,
        logoFile,
        logoExtension,
        removeLogo: removeLogo && !logoFile,
        currentLogoPath: saved?.logoPath ?? null,
        logoAccentBackground: hasLogo ? logoAccentBackground : false,
      });
    },
    onSuccess: async () => {
      setFormError(null);
      await refresh();
      toast("Branding saved.");
    },
    onError: (error: Error) => {
      setFormError(caughtErrorMessage(error));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Organization isn’t loaded yet.");
      await clearOrganizationBranding(
        organizationId,
        saved?.iconPath ?? null,
        saved?.logoPath ?? null,
      );
    },
    onSuccess: async () => {
      setConfirmRemove(false);
      setFormError(null);
      setIconFile(null);
      setRemoveIcon(false);
      setLogoFile(null);
      setRemoveLogo(false);
      setLogoAccentBackground(false);
      setAccentText("");
      await refresh();
      toast("Branding removed.");
    },
    onError: (error: Error) => {
      setConfirmRemove(false);
      setFormError(caughtErrorMessage(error));
    },
  });

  function onAccentChange(value: string) {
    setAccentText(value);
    setFormError(null);
  }

  function onIconChange(file: File | null) {
    if (!file) return;
    const parsed = validateBrandIcon(file);
    if (!parsed.ok) {
      setFormError(parsed.error);
      return;
    }
    setFormError(null);
    setIconFile(file);
    setRemoveIcon(false);
  }

  function onRemoveIcon() {
    setFormError(null);
    if (iconFile) {
      setIconFile(null);
      return;
    }
    setRemoveIcon(true);
  }

  function onLogoChange(file: File | null) {
    if (!file) return;
    const parsed = validateBrandLogo(file);
    if (!parsed.ok) {
      setFormError(parsed.error);
      return;
    }
    setFormError(null);
    setLogoFile(file);
    setRemoveLogo(false);
  }

  function onRemoveLogo() {
    setFormError(null);
    if (logoFile) {
      setLogoFile(null);
      return;
    }
    setRemoveLogo(true);
    setLogoAccentBackground(false);
  }

  function onToggleLogoAccentBackground() {
    setLogoAccentBackground((value) => !value);
    setFormError(null);
  }

  return {
    loading: brandingQuery.isLoading,
    loadError: brandingQuery.error instanceof Error ? brandingQuery.error.message : null,
    accentText,
    iconUrl,
    logoUrl,
    logoAccentBackground,
    draftAccentColor,
    iconFileName: iconFile?.name ?? null,
    logoFileName: logoFile?.name ?? null,
    preview,
    formError: accentError ?? formError,
    hasChanges: dirty && !accentError,
    isDirty: dirty,
    saving: saveMutation.isPending,
    removing: removeMutation.isPending,
    confirmRemove,
    canRemove: Boolean(saved?.accentColor || saved?.iconPath || saved?.logoPath),
    onAccentChange,
    onIconChange,
    onRemoveIcon,
    onLogoChange,
    onRemoveLogo,
    onToggleLogoAccentBackground,
    onSave: () => saveMutation.mutate(),
    onReset: resetDraft,
    onAskRemove: () => setConfirmRemove(true),
    onCancelRemove: () => setConfirmRemove(false),
    onConfirmRemove: () => removeMutation.mutate(),
  };
}

function parseDraft(value: string): string | null {
  const parsed = validateAccentInput(value);
  return parsed.ok ? parsed.value : null;
}

function previewChrome(accentText: string): ChromeAccent {
  const trimmed = accentText.trim();
  if (!trimmed) return DEFAULT_CHROME;
  return chromeAccentFromHex(trimmed) ?? DEFAULT_CHROME;
}
