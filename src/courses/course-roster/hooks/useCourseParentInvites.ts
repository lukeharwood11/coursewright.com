import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  createParentInvite,
  listOrgPendingParentInvites,
  listParentLinksForStudents,
  staffInviteQueryKeys,
  type PendingOrgInvite,
} from "@/organizations/databridge/staffInvites";
import { canInviteParent } from "@/organizations/model/role";
import {
  inviteCreatedMessage,
  inviteUrl,
  validateCreateParentInvite,
} from "@/organizations/model/staffInvite";
import type { StudentSummary } from "@/roster/databridge/students";

export function useCourseParentInvites(students: StudentSummary[]) {
  const user = useAuthedUser();
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canInvite = canInviteParent(role);
  const studentIds = students.map((student) => student.id);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const pendingQuery = useQuery({
    queryKey: staffInviteQueryKeys.parents(organization.id),
    queryFn: () => listOrgPendingParentInvites(organization.id),
    enabled: canInvite,
  });

  const linksQuery = useQuery({
    queryKey: staffInviteQueryKeys.parentLinks(studentIds),
    queryFn: () => listParentLinksForStudents(studentIds),
    enabled: canInvite && studentIds.length > 0,
  });

  const pendingByStudent = new Map<number, PendingOrgInvite[]>();
  for (const invite of pendingQuery.data ?? []) {
    for (const studentProfileId of invite.studentProfileIds) {
      const current = pendingByStudent.get(studentProfileId) ?? [];
      current.push(invite);
      pendingByStudent.set(studentProfileId, current);
    }
  }

  const linkedByStudent = new Map<number, string[]>();
  for (const link of linksQuery.data ?? []) {
    const current = linkedByStudent.get(link.studentProfileId) ?? [];
    if (link.email) current.push(link.email);
    linkedByStudent.set(link.studentProfileId, current);
  }

  const inviteMutation = useMutation({
    mutationFn: async (student: StudentSummary) => {
      const parsed = validateCreateParentInvite({
        email: student.parentEmail ?? "",
      });
      if (!parsed.ok) throw new Error(parsed.error);
      return createParentInvite({
        organizationId: organization.id,
        studentProfileId: student.id,
        email: parsed.value.email,
        invitedBy: user.id,
      });
    },
    onSuccess: async ({ invite, email: emailStatus, attached }) => {
      const wasAttached = attached ?? false;
      const copied = wasAttached
        ? false
        : await copyInvite(invite, { toast: false });
      toast(
        inviteCreatedMessage({
          recipientEmail: invite.email,
          emailSent: emailStatus.sent,
          linkCopied: copied,
          attached: wasAttached,
        }),
      );
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
      if (options?.toast !== false) {
        toast(options?.toast ?? "Couldn’t copy the link. Open the student profile to copy it.");
      }
      return false;
    }
  }

  function canInviteSavedEmail(student: StudentSummary): boolean {
    const email = student.parentEmail;
    if (!email) return false;
    const pending = pendingByStudent.get(student.id) ?? [];
    if (pending.some((invite) => invite.email === email)) return false;
    const linked = linkedByStudent.get(student.id) ?? [];
    return !linked.includes(email);
  }

  return {
    canInvite,
    pendingByStudent,
    linkedByStudent,
    invitingStudentId: inviteMutation.isPending
      ? (inviteMutation.variables?.id ?? null)
      : null,
    copiedId,
    canInviteSavedEmail,
    onInvite: (student: StudentSummary) => inviteMutation.mutate(student),
    onCopy: (studentId: number) => {
      const invite = pendingByStudent.get(studentId)?.[0];
      if (invite) void copyInvite(invite);
    },
  };
}
