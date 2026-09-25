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
import {
  listOrgPeople,
  orgQueryKeys,
  type OrgPerson,
} from "@/organizations/databridge/memberships";
import { canInviteParent } from "@/organizations/model/role";
import {
  inviteCreatedMessage,
  inviteEmailResultMessage,
  inviteUrl,
  normalizeInviteEmail,
  validateCreateParentInvite,
} from "@/organizations/model/staffInvite";
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

  const orgPeopleQuery = useQuery({
    queryKey: orgQueryKeys.people(organization.id),
    queryFn: () => listOrgPeople(organization.id),
    enabled: canInvite,
  });

  const pending = (pendingQuery.data ?? []).filter((invite) =>
    studentId != null && invite.studentProfileIds.includes(studentId),
  );
  const linked = (linksQuery.data ?? []).filter(
    (link) => link.studentProfileId === studentId,
  );

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const parsed = validateCreateParentInvite({ email });
      if (!parsed.ok) throw new Error(parsed.error);
      if (studentId == null) throw new Error("Student isn’t loaded yet.");
      const result = await createParentInvite({
        organizationId: organization.id,
        studentProfileId: studentId,
        email: parsed.value.email,
        invitedBy: user.id,
      });
      const student = await getStudent(studentId);
      if (student && !student.parentEmail) {
        await updateStudent(studentId, {
          name: student.name,
          parentEmail: parsed.value.email,
          studentEmail: student.studentEmail,
          gradeLevel: student.gradeLevel,
        });
      }
      return result;
    },
    onSuccess: async (result) => {
      setAddEmail("");
      const recipientEmail = result.linked
        ? result.linkedParent.email
        : result.invite?.email ?? inviteMutation.variables ?? "";
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
        }),
      );
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
        queryKey: staffInviteQueryKeys.parents(organization.id),
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

  function orgMemberForEmail(rawEmail: string): OrgPerson | null {
    const parsed = validateCreateParentInvite({ email: rawEmail });
    if (!parsed.ok) return null;
    const normalized = parsed.value.email;
    return (
      (orgPeopleQuery.data ?? []).find(
        (person) => normalizeInviteEmail(person.email) === normalized,
      ) ?? null
    );
  }

  return {
    canInvite,
    loading:
      pendingQuery.isLoading || linksQuery.isLoading || orgPeopleQuery.isLoading,
    loadError: pendingQuery.error
      ? pendingQuery.error.message
      : linksQuery.error
        ? linksQuery.error.message
        : null,
    pending,
    linked,
    addEmail,
    invitingEmail: inviteMutation.isPending
      ? (inviteMutation.variables ?? "").trim().toLowerCase()
      : null,
    cancelingId: cancelMutation.isPending
      ? (cancelMutation.variables?.id ?? null)
      : null,
    sendingId: sendEmailMutation.isPending
      ? (sendEmailMutation.variables?.id ?? null)
      : null,
    copiedId,
    origin: typeof window === "undefined" ? "" : window.location.origin,
    orgMemberForEmail,
    setAddEmail,
    onInvite: (email: string) => inviteMutation.mutate(email),
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
