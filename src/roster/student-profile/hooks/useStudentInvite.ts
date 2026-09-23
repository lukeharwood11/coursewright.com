import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  cancelInvite,
  createStudentInvite,
  getStudentAccountLink,
  listOrgPendingStudentInvites,
  sendOrganizationInviteEmail,
  staffInviteQueryKeys,
  type PendingOrgInvite,
} from "@/organizations/databridge/staffInvites";
import { canInviteParent } from "@/organizations/model/role";
import {
  inviteCreatedMessage,
  inviteEmailResultMessage,
  inviteUrl,
  validateCreateParentInvite,
} from "@/organizations/model/staffInvite";

export function useStudentInvite(studentId: number | null, studentEmail: string | null) {
  const user = useAuthedUser();
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canInvite = canInviteParent(role);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const pendingQuery = useQuery({
    queryKey: staffInviteQueryKeys.students(organization.id),
    queryFn: () => listOrgPendingStudentInvites(organization.id),
    enabled: canInvite && studentId != null,
  });

  const accountQuery = useQuery({
    queryKey: ["student-account", studentId] as const,
    queryFn: () => getStudentAccountLink(studentId ?? 0),
    enabled: canInvite && studentId != null,
  });

  const pending = (pendingQuery.data ?? []).filter(
    (invite) => studentId != null && invite.studentProfileIds.includes(studentId),
  );

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const parsed = validateCreateParentInvite({ email: studentEmail ?? "" });
      if (!parsed.ok) throw new Error(parsed.error);
      if (studentId == null) throw new Error("Student isn’t loaded yet.");
      return createStudentInvite({
        organizationId: organization.id,
        studentProfileId: studentId,
        email: parsed.value.email,
        invitedBy: user.id,
      });
    },
    onSuccess: async ({ invite, email: emailStatus }) => {
      const copied = await copyInvite(invite, { toast: false });
      toast(
        inviteCreatedMessage({
          recipientEmail: invite.email,
          emailSent: emailStatus.sent,
          linkCopied: copied,
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.students(organization.id),
      });
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (invite: PendingOrgInvite) => sendOrganizationInviteEmail(invite.id),
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
      toastCaughtError(error);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invite: PendingOrgInvite) => cancelInvite(invite.id),
    onSuccess: async () => {
      toast("Invite canceled.");
      setCopiedId(null);
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.students(organization.id),
      });
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  async function copyInvite(
    invite: PendingOrgInvite,
    options?: { toast?: string | false },
  ): Promise<boolean> {
    const url = inviteUrl(window.location.origin, invite.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      if (options?.toast !== false) {
        toast(options?.toast ?? "Invite link copied.");
      }
      return true;
    } catch {
      setCopiedId(null);
      if (options?.toast !== false) {
        toast(options?.toast ?? "Copy the link from the field.");
      }
      return false;
    }
  }

  return {
    canInvite,
    loading: pendingQuery.isLoading || accountQuery.isLoading,
    loadError: pendingQuery.error
      ? pendingQuery.error.message
      : accountQuery.error
        ? accountQuery.error.message
        : null,
    pending,
    account: accountQuery.data ?? null,
    inviting: inviteMutation.isPending,
    cancelingId: cancelMutation.isPending
      ? (cancelMutation.variables?.id ?? null)
      : null,
    sendingId: sendEmailMutation.isPending
      ? (sendEmailMutation.variables?.id ?? null)
      : null,
    copiedId,
    origin: typeof window === "undefined" ? "" : window.location.origin,
    onInvite: () => inviteMutation.mutate(),
    onCopy: (invite: PendingOrgInvite) => {
      void copyInvite(invite);
    },
    onSendEmail: (invite: PendingOrgInvite) => {
      sendEmailMutation.mutate(invite);
    },
    onCancel: (invite: PendingOrgInvite) => {
      cancelMutation.mutate(invite);
    },
  };
}
