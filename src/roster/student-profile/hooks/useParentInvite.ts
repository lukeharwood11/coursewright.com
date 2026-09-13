import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  cancelInvite,
  createParentInvite,
  listOrgPendingParentInvites,
  listParentLinksForStudents,
  staffInviteQueryKeys,
  type PendingOrgInvite,
} from "@/organizations/databridge/staffInvites";
import { canInviteParent } from "@/organizations/model/role";
import {
  inviteUrl,
  validateCreateParentInvite,
} from "@/organizations/model/staffInvite";

export function useParentInvite(studentId: number | null) {
  const user = useAuthedUser();
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canInvite = canInviteParent(role);
  const [copied, setCopied] = useState(false);

  const pendingQuery = useQuery({
    queryKey: staffInviteQueryKeys.parents(organization.id),
    queryFn: () => listOrgPendingParentInvites(organization.id),
    enabled: canInvite && studentId != null,
  });

  const linksQuery = useQuery({
    queryKey: staffInviteQueryKeys.parentLinks(studentId != null ? [studentId] : []),
    queryFn: () => listParentLinksForStudents(studentId != null ? [studentId] : []),
    enabled: canInvite && studentId != null,
  });

  const pending =
    pendingQuery.data?.find((invite) => invite.studentProfileId === studentId) ??
    null;
  const linked = Boolean(
    linksQuery.data?.some((link) => link.studentProfileId === studentId),
  );

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const parsed = validateCreateParentInvite({ email });
      if (!parsed.ok) throw new Error(parsed.error);
      if (studentId == null) throw new Error("Student isn’t loaded yet.");
      return createParentInvite({
        organizationId: organization.id,
        studentProfileId: studentId,
        email: parsed.value.email,
        invitedBy: user.id,
      });
    },
    onSuccess: async (invite) => {
      await copyInvite(invite);
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.parents(organization.id),
      });
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invite: PendingOrgInvite) => cancelInvite(invite.id),
    onSuccess: async () => {
      toast("Invite canceled.");
      setCopied(false);
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.parents(organization.id),
      });
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  async function copyInvite(invite: PendingOrgInvite) {
    const url = inviteUrl(window.location.origin, invite.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Invite link copied — send it yourself.");
    } catch {
      setCopied(false);
      toast("Copy the link from the field.");
    }
  }

  return {
    canInvite,
    loading: pendingQuery.isLoading || linksQuery.isLoading,
    loadError: pendingQuery.error
      ? pendingQuery.error.message
      : linksQuery.error
        ? linksQuery.error.message
        : null,
    pending,
    linked,
    inviting: inviteMutation.isPending,
    canceling: cancelMutation.isPending,
    copied,
    inviteUrl: pending ? inviteUrl(window.location.origin, pending.token) : null,
    onInvite: (email: string) => inviteMutation.mutate(email),
    onCopy: () => {
      if (pending) void copyInvite(pending);
    },
    onCancel: () => {
      if (pending) cancelMutation.mutate(pending);
    },
  };
}
