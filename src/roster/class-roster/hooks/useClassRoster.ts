import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { caughtErrorMessage, toastCaughtError, toastCheckNetworkConnection } from "@/ui/toast";
import { isNetworkError } from "@/ui/networkError";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { orgQueryKeys } from "@/organizations/databridge/memberships";
import { getOrganization } from "@/organizations/databridge/organizations";
import { canManageOrgSettings } from "@/organizations/model/role";
import {
  addClassLeader,
  addClassMembers,
  classQueryKeys,
  getClass,
  listClassLeaders,
  listClassMembers,
  listOrgStaffForPicker,
  removeClassLeader,
  removeClassMember,
} from "@/roster/databridge/classes";
import { inviteCreatedStudents } from "@/roster/databridge/studentInvites";
import {
  createStudents,
  listStudents,
  studentQueryKeys,
} from "@/roster/databridge/students";
import {
  emptyStudentDraft,
  mergeSelectedIds,
  parseStudentNamesPaste,
  studentsNotIn,
  toggleIdInSet,
  validateStudentBatch,
  withInviteNote,
  type NewStudentDraft,
} from "@/roster/model/studentProfile";

export function useClassRoster() {
  const user = useAuthedUser();
  const { classId: classIdParam } = useParams();
  const classId = classIdParam ? Number(classIdParam) : NaN;
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const classReady = Number.isFinite(classId);
  const canManageLeads = canManageOrgSettings(role);

  const classQuery = useQuery({
    queryKey: classQueryKeys.detail(classId),
    queryFn: () => getClass(classId),
    enabled: classReady,
  });

  const classGroup = classQuery.data ?? null;
  const belongsHere = classGroup?.organizationId === organization.id;

  const membersQuery = useQuery({
    queryKey: classQueryKeys.members(classId),
    queryFn: () => listClassMembers(classId),
    enabled: classReady && belongsHere,
  });

  const leadersQuery = useQuery({
    queryKey: classQueryKeys.leaders(classId),
    queryFn: () => listClassLeaders(classId),
    enabled: classReady && belongsHere,
  });

  const staffQuery = useQuery({
    queryKey: ["classes", "org-staff-picker", organization.id],
    queryFn: () => listOrgStaffForPicker(organization.id),
    enabled: canManageLeads,
  });

  const studentsQuery = useQuery({
    queryKey: studentQueryKeys.list(organization.id),
    queryFn: () => listStudents(organization.id),
  });

  const organizationQuery = useQuery({
    queryKey: orgQueryKeys.detail(organization.id),
    queryFn: () => getOrganization(organization.id),
  });

  const members = membersQuery.data ?? [];
  const availableStudents = studentsNotIn(
    studentsQuery.data ?? [],
    members.map((member) => member.student.id),
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [existingError, setExistingError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<NewStudentDraft[]>([emptyStudentDraft()]);
  const [pasteText, setPasteText] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const addExistingMutation = useMutation({
    mutationFn: async () => {
      if (!classReady) throw new Error("Class isn’t loaded yet.");
      if (selectedIds.length === 0) {
        throw new Error("Choose at least one student to add.");
      }
      await addClassMembers(classId, selectedIds);
      return selectedIds.length;
    },
    onSuccess: async (count) => {
      setSelectedIds([]);
      setExistingError(null);
      setPanelOpen(false);
      await invalidateClass(queryClient, organization.id, classId);
      toast(count === 1 ? "Student added to class." : `${count} students added to class.`);
    },
    onError: (error: Error) => {
      setExistingError(caughtErrorMessage(error));
    },
  });

  const addNewMutation = useMutation({
    mutationFn: async () => {
      if (!classReady) throw new Error("Class isn’t loaded yet.");
      const parsed = validateStudentBatch(
        drafts,
        organizationQuery.data?.gradeLabels ?? [],
      );
      if (!parsed.ok) throw new Error(parsed.error);
      const created = await createStudents(organization.id, parsed.values);
      await addClassMembers(
        classId,
        created.map((student) => student.id),
      );
      const invites = await inviteCreatedStudents({
        organizationId: organization.id,
        students: created,
        invitedBy: user.id,
      });
      return { count: created.length, invites };
    },
    onSuccess: async ({ count, invites }) => {
      setDrafts([emptyStudentDraft()]);
      setPasteText("");
      setNewError(null);
      setPanelOpen(false);
      await invalidateClass(queryClient, organization.id, classId);
      toast(
        withInviteNote(
          count === 1 ? "Student added to class." : `${count} students added to class.`,
          invites,
        ),
      );
    },
    onError: (error: Error) => {
      setNewError(caughtErrorMessage(error));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeClassMember(memberId),
    onSuccess: async () => {
      await invalidateClass(queryClient, organization.id, classId);
      toast("Student removed from class.");
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: (userId: string) => addClassLeader(classId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: classQueryKeys.leaders(classId),
      });
      toast("Lead added.");
    },
    onError: (error: Error) => {
      if (isNetworkError(error)) toastCheckNetworkConnection();
    },
  });

  const removeLeadMutation = useMutation({
    mutationFn: (userId: string) => removeClassLeader(classId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: classQueryKeys.leaders(classId),
      });
      toast("Lead removed.");
    },
    onError: (error: Error) => {
      toastCaughtError(error);
    },
  });

  function onSubmitNew(event: FormEvent) {
    event.preventDefault();
    setNewError(null);
    addNewMutation.mutate();
  }

  function onApplyPaste() {
    const names = parseStudentNamesPaste(pasteText);
    if (names.length === 0) return;
    setDrafts((current) => {
      const next = [...current];
      const firstBlank = next.findIndex((draft) => !draft.name.trim());
      let writeAt = firstBlank >= 0 ? firstBlank : next.length;
      for (const name of names) {
        if (writeAt < next.length) {
          next[writeAt] = { ...next[writeAt], name };
        } else {
          next.push({ ...emptyStudentDraft(), name });
        }
        writeAt += 1;
      }
      return next.length > 0 ? next : [emptyStudentDraft()];
    });
    setPasteText("");
    setNewError(null);
  }

  const leaderIds = new Set((leadersQuery.data ?? []).map((row) => row.userId));

  return {
    organization,
    classGroup: belongsHere ? classGroup : null,
    members,
    leads: leadersQuery.data ?? [],
    staff: (staffQuery.data ?? []).filter((row) => !leaderIds.has(row.userId)),
    canManageLeads,
    addLeadOpen,
    openAddLead: () => {
      addLeadMutation.reset();
      setAddLeadOpen(true);
    },
    closeAddLead: () => {
      setAddLeadOpen(false);
      addLeadMutation.reset();
    },
    addLead: (userId: string) => addLeadMutation.mutate(userId),
    addingLead: addLeadMutation.isPending,
    addLeadError:
      addLeadMutation.error && !isNetworkError(addLeadMutation.error)
        ? addLeadMutation.error.message
        : null,
    onRemoveLead: (userId: string) => removeLeadMutation.mutate(userId),
    availableStudents,
    gradeLabels: organizationQuery.data?.gradeLabels ?? [],
    loading: classQuery.isLoading || membersQuery.isLoading,
    error: classQuery.error
      ? classQuery.error.message
      : membersQuery.error
        ? membersQuery.error.message
        : null,
    notFound: !classQuery.isLoading && (!classGroup || !belongsHere),
    panelOpen,
    tab,
    selectedIds,
    existingError,
    drafts,
    pasteText,
    newError,
    addingExisting: addExistingMutation.isPending,
    addingNew: addNewMutation.isPending,
    removingId: removeMutation.isPending ? (removeMutation.variables ?? null) : null,
    openPanel: () => {
      setPanelOpen(true);
      setTab(availableStudents.length === 0 ? "new" : "existing");
    },
    closePanel: () => {
      setPanelOpen(false);
      setExistingError(null);
      setNewError(null);
    },
    setTab,
    onToggle: (id: number) => {
      setSelectedIds((current) => toggleIdInSet(current, id));
      setExistingError(null);
    },
    onSelectFiltered: (ids: number[]) => {
      setSelectedIds((current) => mergeSelectedIds(current, ids));
      setExistingError(null);
    },
    onClearSelection: () => {
      setSelectedIds([]);
      setExistingError(null);
    },
    onConfirmExisting: () => {
      setExistingError(null);
      addExistingMutation.mutate();
    },
    setDraft: (index: number, draft: NewStudentDraft) => {
      setDrafts((current) =>
        current.map((row, rowIndex) => (rowIndex === index ? draft : row)),
      );
      setNewError(null);
    },
    onAddRow: () => {
      setDrafts((current) => [...current, emptyStudentDraft()]);
      setNewError(null);
    },
    onRemoveRow: (index: number) => {
      setDrafts((current) =>
        current.length <= 1
          ? [emptyStudentDraft()]
          : current.filter((_, rowIndex) => rowIndex !== index),
      );
      setNewError(null);
    },
    setPasteText: (value: string) => {
      setPasteText(value);
      setNewError(null);
    },
    onApplyPaste,
    onSubmitNew,
    onRemove: (memberId: number) => removeMutation.mutate(memberId),
  };
}

async function invalidateClass(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: number,
  classId: number,
) {
  await queryClient.invalidateQueries({
    queryKey: classQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: studentQueryKeys.list(organizationId),
  });
  await queryClient.invalidateQueries({
    queryKey: classQueryKeys.members(classId),
  });
  await queryClient.invalidateQueries({
    queryKey: classQueryKeys.detail(classId),
  });
}
