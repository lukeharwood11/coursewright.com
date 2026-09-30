import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  attendanceQueryKeys,
  deleteClassEntry,
  deleteDay,
  loadClassDateMarks,
  upsertClassEntry,
  upsertDay,
} from "@/attendance/databridge/attendance";
import {
  canWriteClassDay,
  canWriteClassSheet,
  dayBadge,
  mergeAttendanceGrid,
  otherSheetHint,
  todayIso,
  type DayStatus,
  type SheetStatus,
} from "@/attendance/model/daySummary";
import { browsesAsStaff, canManageOrgSettings } from "@/organizations/model/role";
import {
  classQueryKeys,
  getClass,
  listClassLeaders,
  listClassMembers,
} from "@/roster/databridge/classes";
import { toastCaughtError } from "@/ui/toast";

function errorText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useClassAttendance() {
  const user = useAuthedUser();
  const { classId: classIdParam } = useParams();
  const classId = classIdParam ? Number(classIdParam) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const [onDate, setOnDate] = useState(todayIso);
  const classReady = Number.isFinite(classId);
  const isOrgAdmin = Boolean(role && canManageOrgSettings(role));
  const staffBrowse = Boolean(role && browsesAsStaff(role) && !parentPresentation);

  const classQuery = useQuery({
    queryKey: classQueryKeys.detail(classId),
    queryFn: () => getClass(classId),
    enabled: classReady,
  });
  const classGroup = classQuery.data ?? null;
  const belongs = classGroup?.organizationId === organization.id;

  const membersQuery = useQuery({
    queryKey: classQueryKeys.members(classId),
    queryFn: () => listClassMembers(classId),
    enabled: classReady && belongs && staffBrowse,
  });
  const leadersQuery = useQuery({
    queryKey: classQueryKeys.leaders(classId),
    queryFn: () => listClassLeaders(classId),
    enabled: classReady && belongs && staffBrowse,
  });

  const members = membersQuery.data ?? [];
  const memberIds = members.map((member) => member.student.id);
  const memberKey = [...memberIds].sort((a, b) => a - b).join(",");

  const marksQuery = useQuery({
    queryKey: [...attendanceQueryKeys.classDate(classId, onDate), memberKey],
    queryFn: () => loadClassDateMarks({ classId, onDate, memberIds }),
    enabled: classReady && belongs && staffBrowse && membersQuery.isSuccess,
  });

  const isClassLead = (leadersQuery.data ?? []).some((lead) => lead.userId === user.id);
  const writeSheet = canWriteClassSheet({ isOrgAdmin, isClassLead });

  const students = mergeAttendanceGrid(
    members.map((member) => ({ id: member.student.id, name: member.student.name })),
    (marksQuery.data?.entries ?? []).map((entry) => ({
      id: entry.studentId,
      name: entry.name,
    })),
  );
  const entryByStudent = new Map(
    (marksQuery.data?.entries ?? []).map((entry) => [entry.studentId, entry.status]),
  );
  const dayByStudent = new Map(
    (marksQuery.data?.days ?? []).map((day) => [day.studentId, day.status]),
  );
  const othersByStudent = new Map<number, { title: string; status: SheetStatus }[]>();
  for (const other of marksQuery.data?.others ?? []) {
    const list = othersByStudent.get(other.studentId) ?? [];
    list.push({ title: other.title, status: other.status });
    othersByStudent.set(other.studentId, list);
  }

  const rows = students.map((student) => {
    const sheetStatus = entryByStudent.get(student.id) ?? null;
    const dayStatus = dayByStudent.get(student.id) ?? null;
    const others = othersByStudent.get(student.id) ?? [];
    return {
      studentId: student.id,
      name: student.name,
      current: student.current,
      sheetStatus,
      dayStatus,
      badge: dayBadge({
        dayStatus,
        sheetStatuses: [
          ...(sheetStatus ? [sheetStatus] : []),
          ...others.map((other) => other.status),
        ],
      }),
      hint: otherSheetHint(others),
      canWriteSheet: writeSheet,
      canWriteDay: canWriteClassDay({
        isOrgAdmin,
        isClassLead,
        currentMember: student.current,
      }),
    };
  });

  function refresh() {
    return queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
  }

  const sheetMutation = useMutation({
    mutationFn: async (input: { studentId: number; status: SheetStatus | null }) => {
      if (!classGroup) return;
      if (input.status === null) {
        await deleteClassEntry({
          classId,
          studentProfileId: input.studentId,
          onDate,
        });
        return;
      }
      await upsertClassEntry({
        organizationId: classGroup.organizationId,
        classId,
        studentProfileId: input.studentId,
        onDate,
        status: input.status,
      });
    },
    onSuccess: refresh,
    onError: (error) => toastCaughtError(error),
  });

  const dayMutation = useMutation({
    mutationFn: async (input: { studentId: number; status: DayStatus | null }) => {
      if (!classGroup) return;
      if (input.status === null) {
        await deleteDay({ studentProfileId: input.studentId, onDate });
        return;
      }
      await upsertDay({
        organizationId: classGroup.organizationId,
        studentProfileId: input.studentId,
        onDate,
        status: input.status,
      });
    },
    onSuccess: refresh,
    onError: (error) => toastCaughtError(error),
  });

  return {
    organization,
    classId,
    classGroup: belongs ? classGroup : null,
    onDate,
    setOnDate,
    rows,
    staffBrowse,
    roleReady: role != null,
    loading:
      !role ||
      classQuery.isLoading ||
      (staffBrowse && belongs && (membersQuery.isLoading || marksQuery.isLoading)),
    notFound: classReady && !classQuery.isLoading && (!classGroup || !belongs),
    error: errorText(
      classQuery.error ?? membersQuery.error ?? leadersQuery.error ?? marksQuery.error,
    ),
    saveSheet: (studentId: number, status: SheetStatus | null) =>
      sheetMutation.mutate({ studentId, status }),
    saveDay: (studentId: number, status: DayStatus | null) =>
      dayMutation.mutate({ studentId, status }),
    pendingSheetId: sheetMutation.isPending ? sheetMutation.variables?.studentId : null,
    pendingDayId: dayMutation.isPending ? dayMutation.variables?.studentId : null,
  };
}
