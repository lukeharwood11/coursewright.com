import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { caughtErrorMessage } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  getOrgPersonProfile,
  orgPersonQueryKeys,
  type OrgPersonProfile,
} from "@/organizations/databridge/people";
import {
  getOrgProfile,
  orgContactsByUserId,
  updateOrgPersonContact,
  type OrgContact,
} from "@/organizations/databridge/orgNames";
import { staffInviteQueryKeys } from "@/organizations/databridge/staffInvites";
import {
  canEditOrgPersonEmail,
  canEditOrgPersonName,
  isChangingLinkedOrgPersonContactEmail,
  isOrgPersonAccountLinked,
  validateOrgPersonContact,
} from "@/organizations/model/orgPersonContact";
import { orgPersonProfilePath } from "@/organizations/model/paths";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ORG_PERSON_CONTACT_FORM_ID = "org-person-contact-form";

function parseOrgProfileId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function withOrgName(
  directory: OrgPersonProfile | null,
  contact: OrgContact | null,
): OrgPersonProfile | null {
  if (contact) {
    return {
      userId: contact.userId ?? directory?.userId ?? null,
      name: contact.name,
      role: directory?.role ?? null,
      teaches: directory?.teaches ?? [],
      leads: directory?.leads ?? [],
      courses: directory?.courses ?? [],
    };
  }
  return directory;
}

/** Load an org-visible person profile. Pass `userId` for modals; omit to read the route param. */
export function useUserProfile(userIdOverride?: string | null) {
  const { userId: userIdParam } = useParams();
  const personKey = userIdOverride ?? userIdParam ?? "";
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization, role } = useOrgShell();
  const validUuid = UUID_RE.test(personKey);
  const routeOrgProfileId = userIdOverride ? null : parseOrgProfileId(personKey);

  const orgProfileQuery = useQuery({
    queryKey: orgPersonQueryKeys.orgProfile(organization.id, routeOrgProfileId ?? 0),
    queryFn: () => getOrgProfile(organization.id, routeOrgProfileId!),
    enabled: routeOrgProfileId != null,
  });

  const uuidContactQuery = useQuery({
    queryKey: [...orgPersonQueryKeys.profile(organization.id, personKey), "contact"],
    queryFn: async () => {
      const contacts = await orgContactsByUserId(organization.id, [personKey]);
      return contacts.get(personKey) ?? null;
    },
    enabled: validUuid,
  });

  const orgProfile = orgProfileQuery.data ?? null;
  const uuidContact = uuidContactQuery.data ?? null;
  const contact: OrgContact | null =
    routeOrgProfileId != null ? orgProfile : uuidContact;
  const claimedUserId = validUuid ? personKey : (orgProfile?.userId ?? null);
  const claimedUuid =
    claimedUserId && UUID_RE.test(claimedUserId) ? claimedUserId : null;
  const directoryOrgProfileId = contact?.id ?? routeOrgProfileId;
  const redirectToOrgProfile =
    !userIdOverride && validUuid && uuidContact?.id != null;

  const directoryQuery = useQuery({
    queryKey: orgPersonQueryKeys.profile(organization.id, claimedUuid ?? ""),
    queryFn: () => getOrgPersonProfile(organization.id, claimedUuid!),
    enabled: claimedUuid != null && !redirectToOrgProfile,
  });

  useEffect(() => {
    if (!redirectToOrgProfile || uuidContact?.id == null) return;
    navigate(orgPersonProfilePath(organization.slug, uuidContact.id), {
      replace: true,
    });
  }, [redirectToOrgProfile, uuidContact?.id, navigate, organization.slug]);

  const directoryProfile = directoryQuery.data ?? null;
  const profile = withOrgName(directoryProfile, contact);

  const isSelf = Boolean(profile?.userId && profile.userId === user.id);
  const hasOrgProfile = contact != null;
  const canEditName = canEditOrgPersonName({
    actorRole: role,
    isSelf,
    hasOrgProfile,
  });
  const canEditEmail = canEditOrgPersonEmail({
    actorRole: role,
    hasOrgProfile,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmLinkedEmailOpen, setConfirmLinkedEmailOpen] = useState(false);

  const savedContactEmail = contact?.email ?? "";
  const accountLinked = isOrgPersonAccountLinked(profile?.userId);
  const linkedEmailChangeWarning = isChangingLinkedOrgPersonContactEmail({
    accountLinked,
    canEditEmail,
    email,
    savedEmail: savedContactEmail,
  });

  const resetForm = useCallback(() => {
    setName(contact?.name ?? profile?.name ?? "");
    setEmail(contact?.email ?? "");
    setFormError(null);
  }, [contact, profile?.name]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const orgProfileToUpdate = contact?.id ?? routeOrgProfileId;
      if (orgProfileToUpdate == null) {
        throw new Error("That person doesn’t have an organization profile yet.");
      }
      const parsed = validateOrgPersonContact({
        name,
        email,
        includeEmail: canEditEmail,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      await updateOrgPersonContact({
        orgProfileId: orgProfileToUpdate,
        name: parsed.value.name,
        email: canEditEmail ? parsed.value.email : undefined,
      });
      return parsed.value.name;
    },
    onSuccess: async (savedName) => {
      setFormError(null);
      toast("Saved.");
      await Promise.all([
        claimedUuid
          ? queryClient.invalidateQueries({
              queryKey: orgPersonQueryKeys.profile(organization.id, claimedUuid),
            })
          : Promise.resolve(),
        directoryOrgProfileId != null
          ? queryClient.invalidateQueries({
              queryKey: orgPersonQueryKeys.orgProfile(
                organization.id,
                directoryOrgProfileId,
              ),
            })
          : Promise.resolve(),
        claimedUuid
          ? queryClient.invalidateQueries({
              queryKey: [
                ...orgPersonQueryKeys.profile(organization.id, claimedUuid),
                "contact",
              ],
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({
          queryKey: staffInviteQueryKeys.staff(organization.id),
        }),
        queryClient.invalidateQueries({
          queryKey: staffInviteQueryKeys.org(organization.id),
        }),
      ]);
      if (profile && savedName !== profile.name) {
        setName(savedName);
      }
    },
    onError: (error: Error) => {
      setFormError(caughtErrorMessage(error));
    },
  });

  const hasChanges =
    name.trim() !== (contact?.name ?? profile?.name ?? "").trim() ||
    (canEditEmail && email.trim() !== savedContactEmail.trim());

  function performSave() {
    saveMutation.mutate();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges) return;
    setFormError(null);
    if (linkedEmailChangeWarning) {
      setConfirmLinkedEmailOpen(true);
      return;
    }
    performSave();
  }

  function onConfirmLinkedEmailSave() {
    setConfirmLinkedEmailOpen(false);
    performSave();
  }

  function onCancelLinkedEmailSave() {
    setConfirmLinkedEmailOpen(false);
  }

  const loading =
    redirectToOrgProfile ||
    (validUuid && uuidContactQuery.isLoading) ||
    (validUuid &&
      userIdOverride != null &&
      directoryQuery.isLoading) ||
    (validUuid &&
      !userIdOverride &&
      uuidContactQuery.isFetched &&
      !uuidContact &&
      directoryQuery.isLoading) ||
    (routeOrgProfileId != null && orgProfileQuery.isLoading) ||
    (claimedUuid != null &&
      routeOrgProfileId != null &&
      directoryQuery.isLoading);

  const notFound = redirectToOrgProfile
    ? false
    : validUuid
      ? !uuidContactQuery.isLoading &&
        !directoryQuery.isLoading &&
        !profile
      : routeOrgProfileId != null
        ? !orgProfileQuery.isLoading && !orgProfile
        : true;

  return {
    organization,
    role,
    userId: personKey,
    orgProfileId: directoryOrgProfileId,
    profile,
    loading,
    error:
      directoryQuery.error?.message ??
      orgProfileQuery.error?.message ??
      uuidContactQuery.error?.message ??
      null,
    notFound,
    canEditName,
    canEditEmail,
    linkedEmailChangeWarning,
    confirmLinkedEmailOpen,
    onConfirmLinkedEmailSave,
    onCancelLinkedEmailSave,
    name,
    email,
    formError,
    saving: saveMutation.isPending,
    hasChanges,
    onNameChange: (value: string) => {
      setName(value);
      setFormError(null);
    },
    onEmailChange: (value: string) => {
      setEmail(value);
      setFormError(null);
    },
    onSubmit,
  };
}
