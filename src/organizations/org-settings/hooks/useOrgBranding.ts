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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  function resetDraft() {
    setAccentText(saved?.accentColor ?? "");
    setIconFile(null);
    setRemoveIcon(false);
    setFormError(null);
  }

  useEffect(() => {
    resetDraft();
  }, [saved?.accentColor, saved?.iconPath, saved?.updatedAt]);

  useEffect(() => {
    if (!iconFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(iconFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [iconFile]);

  const savedAccent = saved?.accentColor ?? "";
  const draftAccent = accentText.trim() === "" ? "" : (parseDraft(accentText) ?? accentText.trim());
  const dirty = draftAccent !== savedAccent || iconFile != null || removeIcon;
  const accentCheck = validateAccentInput(accentText);
  const accentError = accentText.trim() && !accentCheck.ok ? accentCheck.error : null;

  const preview = previewChrome(accentText);
  const iconUrl = previewUrl ?? (removeIcon ? null : saved?.iconUrl ?? null);

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
      await saveOrganizationBranding({
        organizationId,
        accentColor: accent.value,
        iconFile,
        iconExtension,
        removeIcon: removeIcon && !iconFile,
        currentIconPath: saved?.iconPath ?? null,
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
      await clearOrganizationBranding(organizationId, saved?.iconPath ?? null);
    },
    onSuccess: async () => {
      setConfirmRemove(false);
      setFormError(null);
      setIconFile(null);
      setRemoveIcon(false);
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

  return {
    loading: brandingQuery.isLoading,
    loadError: brandingQuery.error instanceof Error ? brandingQuery.error.message : null,
    accentText,
    iconUrl,
    iconFileName: iconFile?.name ?? null,
    preview,
    formError: accentError ?? formError,
    hasChanges: dirty && !accentError,
    isDirty: dirty,
    saving: saveMutation.isPending,
    removing: removeMutation.isPending,
    confirmRemove,
    canRemove: Boolean(saved?.accentColor || saved?.iconPath),
    onAccentChange,
    onIconChange,
    onRemoveIcon,
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
