import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  cancelStaffInvite,
  createStaffInvite,
  listOrgPendingInvites,
  listOrgStaff,
  staffInviteQueryKeys,
  type PendingStaffInvite,
} from "@/organizations/databridge/staffInvites";
import {
  canInviteStaff,
  inviteableStaffRoles,
  type OrgRole,
  type StaffInviteRole,
} from "@/organizations/model/role";
import { compareStaffRole, staffInviteUrl, validateCreateStaffInvite } from "@/organizations/model/staffInvite";

export function useOrgStaff(organizationId: string, role: OrgRole | null) {
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const canInvite = role ? canInviteStaff(role) : false;
  const roles = role ? inviteableStaffRoles(role) : [];

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffInviteRole>(roles[0] ?? "instructor");
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastInviteId, setLastInviteId] = useState<string | null>(null);

  const selectedRole = roles.includes(inviteRole) ? inviteRole : (roles[0] ?? "instructor");

  const staffQuery = useQuery({
    queryKey: staffInviteQueryKeys.staff(organizationId),
    queryFn: () => listOrgStaff(organizationId),
    enabled: Boolean(organizationId),
  });

  const pendingQuery = useQuery({
    queryKey: staffInviteQueryKeys.org(organizationId),
    queryFn: () => listOrgPendingInvites(organizationId),
    enabled: Boolean(organizationId) && canInvite,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error("You don’t have permission to invite collaborators.");
      const parsed = validateCreateStaffInvite({
        email,
        role: selectedRole,
        actorRole: role,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      return createStaffInvite({
        organizationId,
        email: parsed.value.email,
        role: parsed.value.role,
        invitedBy: user.id,
      });
    },
    onSuccess: async (invite) => {
      setEmail("");
      setFormError(null);
      const url = staffInviteUrl(window.location.origin, invite.token);
      setLastInviteId(invite.id);
      setCopiedId(invite.id);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast("Invite created. Link copied — send it yourself.");
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.org(organizationId),
      });
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invite: PendingStaffInvite) => cancelStaffInvite(invite.id),
    onSuccess: async () => {
      toast("Invite canceled.");
      setLastInviteId(null);
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.org(organizationId),
      });
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const members = [...(staffQuery.data ?? [])].sort((a, b) => {
    const byRole = compareStaffRole(a.role, b.role);
    if (byRole !== 0) return byRole;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });

  const pending = pendingQuery.data ?? [];
  const lastInvite = pending.find((invite) => invite.id === lastInviteId) ?? null;

  function onInvite(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    inviteMutation.mutate();
  }

  async function onCopy(invite: PendingStaffInvite) {
    const url = staffInviteUrl(window.location.origin, invite.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      setLastInviteId(invite.id);
      toast("Invite link copied.");
    } catch {
      setLastInviteId(invite.id);
      toast("Copy the link from the field.");
    }
  }

  return {
    canInvite,
    roles,
    loading: staffQuery.isLoading || (canInvite && pendingQuery.isLoading),
    loadError: staffQuery.error
      ? staffQuery.error.message
      : pendingQuery.error
        ? pendingQuery.error.message
        : null,
    members,
    pending,
    email,
    role: selectedRole,
    formError,
    inviting: inviteMutation.isPending,
    copiedId,
    cancelingId: cancelMutation.isPending
      ? (cancelMutation.variables?.id ?? null)
      : null,
    lastInviteUrl: lastInvite
      ? staffInviteUrl(window.location.origin, lastInvite.token)
      : null,
    lastInvite,
    onEmailChange: (value: string) => {
      setEmail(value);
      setFormError(null);
    },
    onRoleChange: (value: StaffInviteRole) => {
      setInviteRole(value);
      setFormError(null);
    },
    onInvite,
    onCopy,
    onCancel: (invite: PendingStaffInvite) => cancelMutation.mutate(invite),
  };
}
