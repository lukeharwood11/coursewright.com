import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  attendanceQueryKeys,
  deleteDay,
  loadDayWriteFlags,
  loadStudentAttendance,
  upsertDay,
} from "@/attendance/databridge/attendance";
import {
  attendanceWindow,
  canWriteStudentDay,
  studentAttendanceDays,
  todayIso,
  type DayStatus,
} from "@/attendance/model/daySummary";
import { canManageOrgSettings, isStaffRole } from "@/organizations/model/role";
import { toastCaughtError } from "@/ui/toast";

function errorText(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function useStudentAttendance(studentId: number) {
  const user = useAuthedUser();
  const { organization, role, parentPresentation } = useOrgShell();
  const queryClient = useQueryClient();
  const [through, setThrough] = useState(todayIso);
  const dates = attendanceWindow(through, 14);
  const from = dates[0] ?? through;
  const to = dates[dates.length - 1] ?? through;
  const isOrgAdmin = Boolean(role && canManageOrgSettings(role) && !parentPresentation);
  const maybeWriter = Boolean(
    role && isStaffRole(role) && !parentPresentation && !isOrgAdmin,
  );
  const ready = Number.isFinite(studentId);

  const writeQuery = useQuery({
    queryKey: attendanceQueryKeys.dayWrite(studentId, user.id),
    queryFn: () => loadDayWriteFlags(studentId, user.id),
    enabled: ready && maybeWriter,
  });
  const writeReady = !maybeWriter || writeQuery.isSuccess || writeQuery.isError;
  const canWrite = canWriteStudentDay({
    isOrgAdmin,
    leadsCurrentClass: writeQuery.data?.leadsCurrentClass ?? false,
    teachesActiveEnrollment: writeQuery.data?.teachesActiveEnrollment ?? false,
  });

  const attendanceQuery = useQuery({
    queryKey: attendanceQueryKeys.student(studentId, from, to),
    queryFn: () => loadStudentAttendance(studentId, from, to),
    enabled: ready && dates.length > 0,
  });

  const days = studentAttendanceDays({
    dates,
    days: attendanceQuery.data?.days ?? [],
    marks: attendanceQuery.data?.marks ?? [],
    includeEmpty: canWrite,
  });

  const dayMutation = useMutation({
    mutationFn: async (input: { onDate: string; status: DayStatus | null }) => {
      if (input.status === null) {
        await deleteDay({ studentProfileId: studentId, onDate: input.onDate });
        return;
      }
      await upsertDay({
        organizationId: organization.id,
        studentProfileId: studentId,
        onDate: input.onDate,
        status: input.status,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all }),
    onError: (error) => toastCaughtError(error),
  });

  return {
    through,
    setThrough,
    days,
    canWrite,
    loading: attendanceQuery.isLoading || !writeReady,
    error: errorText(attendanceQuery.error ?? writeQuery.error),
    saveDay: (onDate: string, status: DayStatus | null) =>
      dayMutation.mutate({ onDate, status }),
    pendingDate: dayMutation.isPending ? dayMutation.variables?.onDate : null,
  };
}
