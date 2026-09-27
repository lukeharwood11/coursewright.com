import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { caughtErrorMessage, toastCaughtError } from "@/ui/toast";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import {
  listOrgMembersWithAccess,
  orgQueryKeys,
  reactivateOrgMember,
  removeMemberFromOrg,
  suspendOrgMember,
  type OrgMemberAccessRow,
} from "@/organizations/databridge/memberships";
import { staffInviteQueryKeys } from "@/organizations/databridge/staffInvites";
import { canManageStaff, type OrgRole } from "@/organizations/model/role";
import {
  isLastOrgManager,
  memberAccessActions,
  validateReactivateOrgMember,
  validateRemoveFromOrg,
  validateSuspendOrgMember,
} from "@/organizations/model/staffAccount";

export type OrgPeopleMemberRow = OrgMemberAccessRow & {
  isYou: boolean;
  canSuspend: boolean;
  canReactivate: boolean;
  canRemoveFromOrg: boolean;
  lastManagerGuard: boolean;
};

export function useOrgPeople(organizationId: number | undefined, role: OrgRole | null) {
  const user = useAuthedUser();
  const queryClient = useQueryClient();
  const canManage = role != null && canManageStaff(role);

  const peopleQuery = useQuery({
    queryKey: orgQueryKeys.membersWithAccess(organizationId ?? 0),
    queryFn: () => listOrgMembersWithAccess(organizationId!),
    enabled: Boolean(organizationId) && canManage,
  });

  const rawMembers = peopleQuery.data ?? [];

  const members: OrgPeopleMemberRow[] = rawMembers.map((member) => {
    const actions = memberAccessActions({
      actorRole: role,
      actorUserId: user.id,
      member: {
        membershipId: member.membershipId,
        userId: member.userId,
        role: member.role,
        status: member.status,
      },
      members: rawMembers.map((row) => ({
        membershipId: row.membershipId,
        role: row.role,
        status: row.status,
      })),
    });
    return {
      ...member,
      isYou: member.userId === user.id,
      ...actions,
    };
  });

  async function invalidatePeople() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: orgQueryKeys.membersWithAccess(organizationId ?? 0),
      }),
      queryClient.invalidateQueries({
        queryKey: staffInviteQueryKeys.staff(organizationId ?? 0),
      }),
      queryClient.invalidateQueries({ queryKey: ["organizations"] }),
    ]);
  }

  const suspendMutation = useMutation({
    mutationFn: async (member: OrgPeopleMemberRow) => {
      const parsed = validateSuspendOrgMember({
        actorRole: role!,
        targetRole: member.role,
        targetStatus: member.status,
        targetUserId: member.userId,
        actorUserId: user.id,
        isLastManager: isLastOrgManager(
          rawMembers.filter((row) => row.status === "active"),
          member.membershipId,
        ),
      });
      if (!parsed.ok) throw new Error(parsed.error);
      await suspendOrgMember(member.membershipId);
      return member;
    },
    onSuccess: async (member) => {
      await invalidatePeople();
      toast(`Suspended ${member.name || member.email}.`);
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (member: OrgPeopleMemberRow) => {
      const parsed = validateReactivateOrgMember({
        actorRole: role!,
        targetRole: member.role,
        targetStatus: member.status,
        targetUserId: member.userId,
        actorUserId: user.id,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      await reactivateOrgMember(member.membershipId);
      return member;
    },
    onSuccess: async (member) => {
      await invalidatePeople();
      toast(`Restored access for ${member.name || member.email}.`);
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const removeMutation = useMutation({
    mutationFn: async (member: OrgPeopleMemberRow) => {
      const parsed = validateRemoveFromOrg({
        actorRole: role!,
        targetRole: member.role,
        targetUserId: member.userId,
        actorUserId: user.id,
        isLastManager: isLastOrgManager(
          rawMembers.filter((row) => row.status === "active"),
          member.membershipId,
        ),
      });
      if (!parsed.ok) throw new Error(parsed.error);
      await removeMemberFromOrg(member.membershipId);
      return member;
    },
    onSuccess: async (member) => {
      await invalidatePeople();
      toast(`Removed ${member.name || member.email} from this organization.`);
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const busyMembershipId =
    suspendMutation.isPending
      ? (suspendMutation.variables?.membershipId ?? null)
      : reactivateMutation.isPending
        ? (reactivateMutation.variables?.membershipId ?? null)
        : removeMutation.isPending
          ? (removeMutation.variables?.membershipId ?? null)
          : null;

  return {
    canManage,
    loading: peopleQuery.isLoading,
    loadError: peopleQuery.error ? caughtErrorMessage(peopleQuery.error) : null,
    members,
    suspendingId:
      suspendMutation.isPending ? suspendMutation.variables?.membershipId ?? null : null,
    reactivatingId:
      reactivateMutation.isPending
        ? reactivateMutation.variables?.membershipId ?? null
        : null,
    removingId:
      removeMutation.isPending ? removeMutation.variables?.membershipId ?? null : null,
    busyMembershipId,
    onSuspend: (member: OrgPeopleMemberRow) => suspendMutation.mutate(member),
    onReactivate: (member: OrgPeopleMemberRow) => reactivateMutation.mutate(member),
    onRemoveFromOrg: (
      member: OrgPeopleMemberRow,
      afterSuccess?: () => void,
    ) =>
      removeMutation.mutate(member, afterSuccess ? { onSuccess: afterSuccess } : undefined),
  };
}
