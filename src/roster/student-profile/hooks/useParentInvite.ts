import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  cancelInvite,
  createParentInvite,
  sendOrganizationInviteEmail,
  listOrgPendingParentInvites,
  listParentLinksForStudents,
  staffInviteQueryKeys,
  type PendingOrgInvite,
} from "@/organizations/databridge/staffInvites";
import { validateOrgPersonContact } from "@/organizations/model/orgPersonContact";
import { canInviteParent } from "@/organizations/model/role";
import {
  inviteCreatedMessage,
  inviteEmailResultMessage,
  inviteUrl,
  normalizeInviteEmail,
  validateCreateParentInvite,
} from "@/organizations/model/staffInvite";
import {
  addParentToStudent,
  removeParentFromStudent,
} from "@/roster/databridge/parentLinks";
import type { ParentLinkStatus } from "@/organizations/databridge/staffInvites";
import {
  getStudent,
  studentQueryKeys,
  updateStudent,
} from "@/roster/databridge/students";

export function useParentInvite(studentId: number | null) {
  const user = useAuthedUser();
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canInvite = canInviteParent(role);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");

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

  const pending = (pendingQuery.data ?? []).filter((invite) =>
    studentId != null && invite.studentProfileIds.includes(studentId),
  );
  const linked = (linksQuery.data ?? []).filter(
    (link) => link.studentProfileId === studentId,
  );

  async function invalidateParentQueries() {
    await queryClient.invalidateQueries({
      queryKey: staffInviteQueryKeys.parents(organization.id),
    });
    if (studentId != null) {
      await queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.parentLinks([studentId]),
      });
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(studentId),
      });
      await queryClient.invalidateQueries({
        queryKey: studentQueryKeys.list(organization.id),
      });
    }
  }

  const addMutation = useMutation({
    mutationFn: async (input: { name: string; email: string }) => {
      const parsed = validateOrgPersonContact({
        name: input.name,
        email: input.email,
        includeEmail: true,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      if (studentId == null) throw new Error("Student isn’t loaded yet.");
      return addParentToStudent({
        organizationId: organization.id,
        studentProfileId: studentId,
        name: parsed.value.name,
        email: parsed.value.email,
      });
    },
    onSuccess: async (_result, variables) => {
      setAddName("");
      setAddEmail("");
      const email = variables.email.trim().toLowerCase();
      if (studentId != null && email) {
        const student = await getStudent(studentId);
        if (student && !student.parentEmail) {
          await updateStudent(studentId, {
            name: student.name,
            parentEmail: email,
            studentEmail: student.studentEmail,
            gradeLevel: student.gradeLevel,
          });
        }
      }
      toast(
        inviteCreatedMessage({
          recipientEmail: email,
          emailSent: false,
          linkCopied: false,
          addedWithoutInviteEmail: true,
        }),
      );
      await invalidateParentQueries();
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (input: { email: string; orgProfileId?: number }) => {
      const parsed = validateCreateParentInvite({ email: input.email });
      if (!parsed.ok) throw new Error(parsed.error);
      if (studentId == null) throw new Error("Student isn’t loaded yet.");
      const result = await createParentInvite({
        organizationId: organization.id,
        studentProfileId: studentId,
        email: parsed.value.email,
        invitedBy: user.id,
        orgProfileId: input.orgProfileId,
      });
      return result;
    },
    onSuccess: async (result) => {
      const recipientEmail = result.linked
        ? result.linkedParent.email
        : result.invite?.email ?? inviteMutation.variables?.email ?? "";
      const copied =
        result.linked || result.attached || !result.invite
          ? false
          : await copyInvite(result.invite, { toast: false });
      toast(
        inviteCreatedMessage({
          recipientEmail,
          emailSent: result.email.sent,
          linkCopied: copied,
          attached: !result.linked && result.attached,
          linked: result.linked,
          linkedParentName: result.linked ? result.linkedParent.name : undefined,
        }),
      );
      await invalidateParentQueries();
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

  const removeMutation = useMutation({
    mutationFn: async (parent: ParentLinkStatus) => {
      if (studentId == null) throw new Error("Student isn’t loaded yet.");
      await removeParentFromStudent({
        studentProfileId: studentId,
        parentOrgProfileId: parent.parentOrgProfileId,
      });
    },
    onSuccess: async () => {
      toast("Parent removed from this student.");
      await invalidateParentQueries();
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
      await invalidateParentQueries();
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

  function pendingInviteForEmail(email: string): PendingOrgInvite | null {
    const normalized = normalizeInviteEmail(email);
    if (!normalized) return null;
    return (
      pending.find((invite) => normalizeInviteEmail(invite.email) === normalized) ??
      null
    );
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
    addName,
    addEmail,
    addingParent: addMutation.isPending,
    removingParentOrgProfileId: removeMutation.isPending
      ? (removeMutation.variables?.parentOrgProfileId ?? null)
      : null,
    invitingEmail: inviteMutation.isPending
      ? normalizeInviteEmail(inviteMutation.variables?.email ?? "")
      : null,
    cancelingId: cancelMutation.isPending
      ? (cancelMutation.variables?.id ?? null)
      : null,
    sendingId: sendEmailMutation.isPending
      ? (sendEmailMutation.variables?.id ?? null)
      : null,
    copiedId,
    origin: typeof window === "undefined" ? "" : window.location.origin,
    pendingInviteForEmail,
    setAddName,
    setAddEmail,
    onAddParent: () =>
      addMutation.mutate({ name: addName, email: addEmail }),
    onAddSavedParentEmail: (name: string, email: string) =>
      addMutation.mutate({ name, email }),
    onInvite: (email: string, orgProfileId?: number) =>
      inviteMutation.mutate({ email, orgProfileId }),
    onCopy: (invite: PendingOrgInvite) => {
      void copyInvite(invite);
    },
    onSendEmail: (invite: PendingOrgInvite) => {
      sendEmailMutation.mutate(invite);
    },
    onCancel: (invite: PendingOrgInvite) => {
      cancelMutation.mutate(invite);
    },
    onRemove: (parent: ParentLinkStatus) => {
      removeMutation.mutate(parent);
    },
  };
}
