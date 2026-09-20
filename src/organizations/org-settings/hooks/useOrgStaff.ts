import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  removeStaffMembership,
  updateStaffMembershipRole,
} from "@/organizations/databridge/memberships";
import {
  cancelStaffInvite,
  createStaffInvite,
  sendOrganizationInviteEmail,
  listOrgPendingInvites,
  listOrgStaff,
  staffInviteQueryKeys,
  type OrgStaffMember,
  type PendingStaffInvite,
} from "@/organizations/databridge/staffInvites";
import {
  canInviteStaff,
  canManageStaff,
  inviteableStaffRoles,
  parseAssignableMembershipRole,
  roleLabel,
  type AssignableMembershipRole,
  type OrgRole,
  type StaffInviteRole,
} from "@/organizations/model/role";
import {
  isLastOrgManager,
  staffMemberActions,
  validateChangeStaffRole,
  validateRemoveStaffMember,
} from "@/organizations/model/staffAccount";
import {
  compareStaffRole,
  inviteCreatedMessage,
  inviteEmailResultMessage,
  staffInviteUrl,
  validateCreateStaffInvite,
} from "@/organizations/model/staffInvite";

export type StaffMemberRow = OrgStaffMember & {
  isYou: boolean;
  canChangeRole: boolean;
  canRemove: boolean;
  changeRoles: AssignableMembershipRole[];
  lastManagerGuard: boolean;
};

export function useOrgStaff(organizationId: number | undefined, role: OrgRole | null) {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canInvite = role ? canInviteStaff(role) : false;
  const canManage = role ? canManageStaff(role) : false;
  const roles = role ? inviteableStaffRoles(role) : [];

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffInviteRole>("instructor");
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [lastInviteId, setLastInviteId] = useState<number | null>(null);
  const [lastInviteSent, setLastInviteSent] = useState(false);

  const selectedRole = roles.includes(inviteRole)
    ? inviteRole
    : roles.includes("instructor")
      ? "instructor"
      : (roles[0] ?? "instructor");

  const staffQuery = useQuery({
    queryKey: staffInviteQueryKeys.staff(organizationId ?? 0),
    queryFn: () => listOrgStaff(organizationId!),
    enabled: Boolean(organizationId),
  });

  const pendingQuery = useQuery({
    queryKey: staffInviteQueryKeys.org(organizationId ?? 0),
    queryFn: () => listOrgPendingInvites(organizationId!),
    enabled: Boolean(organizationId) && canInvite,
  });

  const members = [...(staffQuery.data ?? [])].sort((a, b) => {
    const byRole = compareStaffRole(a.role, b.role);
    if (byRole !== 0) return byRole;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });

  async function invalidateStaff() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.staff(organizationId ?? 0),
      }),
      queryClient.invalidateQueries({ queryKey: ["organizations"] }),
    ]);
  }

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
        organizationId: organizationId!,
        email: parsed.value.email,
        role: parsed.value.role,
        invitedBy: user.id,
      });
    },
    onSuccess: async ({ invite, email: emailStatus }) => {
      setEmail("");
      setFormError(null);
      setLastInviteId(invite.id);
      setLastInviteSent(emailStatus.sent);
      toast(
        inviteCreatedMessage({
          recipientEmail: invite.email,
          emailSent: emailStatus.sent,
          linkCopied: false,
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.org(organizationId ?? 0),
      });
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (invite: PendingStaffInvite) => sendOrganizationInviteEmail(invite.id),
    onSuccess: (status, invite) => {
      toast(
        inviteEmailResultMessage({
          recipientEmail: invite.email,
          emailSent: status.sent,
          emailError: status.error,
        }),
      );
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invite: PendingStaffInvite) => cancelStaffInvite(invite.id),
    onSuccess: async () => {
      toast("Invite canceled.");
      setLastInviteId(null);
      setLastInviteSent(false);
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.org(organizationId ?? 0),
      });
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (input: {
      member: OrgStaffMember;
      nextRole: AssignableMembershipRole;
    }) => {
      if (!role) throw new Error("You don’t have permission to change collaborator roles.");
      const parsed = validateChangeStaffRole({
        actorRole: role,
        currentRole: input.member.role,
        nextRole: input.nextRole,
        isLastManager: isLastOrgManager(members, input.member.membershipId),
        hasLinkedStudent: input.member.hasLinkedStudent,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      if (parsed.value === input.member.role) return input;
      await updateStaffMembershipRole({
        membershipId: input.member.membershipId,
        role: parsed.value,
      });
      return { ...input, nextRole: parsed.value };
    },
    onSuccess: async (input) => {
      const name = input.member.name || input.member.email;
      toast(`Changed ${name} to ${roleLabel(input.nextRole).toLowerCase()}.`);
      await invalidateStaff();
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (member: OrgStaffMember) => {
      if (!role) throw new Error("You don’t have permission to remove collaborators.");
      const parsed = validateRemoveStaffMember({
        actorRole: role,
        targetRole: member.role,
        isLastManager: isLastOrgManager(members, member.membershipId),
        hasLinkedStudent: member.hasLinkedStudent,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      await removeStaffMembership(member.membershipId);
      return member;
    },
    onSuccess: async (member) => {
      const removedSelf = member.userId === user.id;
      if (removedSelf) {
        toast("You were removed as a collaborator in this organization.");
        await invalidateStaff();
        navigate("/my");
        return;
      }
      const name = member.name || member.email;
      toast(`Removed ${name} as a collaborator.`);
      await invalidateStaff();
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const pending = pendingQuery.data ?? [];
  const lastInvite = pending.find((invite) => invite.id === lastInviteId) ?? null;

  const rows: StaffMemberRow[] = members.map((member) => {
    const actions = staffMemberActions({ actorRole: role, member, members });
    return {
      ...member,
      isYou: member.userId === user.id,
      ...actions,
    };
  });

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
      toast("Invite link copied.");
    } catch {
      toast("Copy the link from the pending invite.");
    }
  }

  function onChangeRole(member: OrgStaffMember, nextRole: string) {
    const parsed = parseAssignableMembershipRole(nextRole);
    if (!parsed || parsed === member.role) return;
    changeRoleMutation.mutate({ member, nextRole: parsed });
  }

  return {
    canInvite,
    canManage,
    roles,
    loading: staffQuery.isLoading || (canInvite && pendingQuery.isLoading),
    loadError: staffQuery.error
      ? staffQuery.error.message
      : pendingQuery.error
        ? pendingQuery.error.message
        : null,
    members: rows,
    pending,
    email,
    role: selectedRole,
    formError,
    inviting: inviteMutation.isPending,
    copiedId,
    sendingId: sendEmailMutation.isPending
      ? (sendEmailMutation.variables?.id ?? null)
      : null,
    cancelingId: cancelMutation.isPending
      ? (cancelMutation.variables?.id ?? null)
      : null,
    changingId: changeRoleMutation.isPending
      ? (changeRoleMutation.variables?.member.membershipId ?? null)
      : null,
    removingId: removeMutation.isPending
      ? (removeMutation.variables?.membershipId ?? null)
      : null,
    lastInviteSent: Boolean(lastInvite && lastInviteSent),
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
    onSendEmail: (invite: PendingStaffInvite) => sendEmailMutation.mutate(invite),
    onCancel: (invite: PendingStaffInvite) => cancelMutation.mutate(invite),
    onChangeRole,
    onRemove: (member: OrgStaffMember) => removeMutation.mutate(member),
  };
}
