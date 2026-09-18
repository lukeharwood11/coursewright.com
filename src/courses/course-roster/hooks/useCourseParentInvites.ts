import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

  const pendingByStudent = new Map<number, PendingOrgInvite>();
  for (const invite of pendingQuery.data ?? []) {
    if (invite.studentProfileId != null) {
      pendingByStudent.set(invite.studentProfileId, invite);
    }
  }
  const linkedStudentIds = new Set(
    (linksQuery.data ?? []).map((link) => link.studentProfileId),
  );

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

  async function copyInvite(invite: PendingOrgInvite) {
    const url = inviteUrl(window.location.origin, invite.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      toast("Invite link copied — send it yourself.");
    } catch {
      toast("Couldn’t copy the link. Open the student profile to copy it.");
    }
  }

  return {
    canInvite,
    pendingByStudent,
    linkedStudentIds,
    invitingStudentId: inviteMutation.isPending
      ? (inviteMutation.variables?.id ?? null)
      : null,
    copiedId,
    onInvite: (student: StudentSummary) => inviteMutation.mutate(student),
    onCopy: (studentId: number) => {
      const invite = pendingByStudent.get(studentId);
      if (invite) void copyInvite(invite);
    },
  };
}
