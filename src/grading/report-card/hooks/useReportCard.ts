import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  deleteReportCard,
  getReportCard,
  listReportCardDeliveries,
  refreshReportCard,
  reportCardQueryKeys,
  resendReportCardDelivery,
  saveReportCardNarrative,
  sendReportCardEmail,
  submitReportCard,
} from "@/grading/databridge/reportCards";
import { studentPath } from "@/grading/model/paths";
import { toastCaughtError } from "@/ui/toast";

export function useReportCard() {
  const { cardId: cardIdParam } = useParams();
  const cardId = cardIdParam ? Number(cardIdParam) : NaN;
  const ready = Number.isFinite(cardId);
  const { organization, role, parentPresentation } = useOrgShell();
  const canEdit = staffCanEdit(role, parentPresentation);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cardQuery = useQuery({
    queryKey: reportCardQueryKeys.detail(cardId),
    queryFn: () => getReportCard(cardId),
    enabled: ready,
  });
  const deliveriesQuery = useQuery({
    queryKey: ["report-card-deliveries", cardId],
    queryFn: () => listReportCardDeliveries(cardId),
    enabled: ready && canEdit && cardQuery.data != null,
  });
  const [narrative, setNarrative] = useState("");

  useEffect(() => {
    if (cardQuery.data) setNarrative(cardQuery.data.narrative);
  }, [cardQuery.data]);

  async function reload() {
    await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.detail(cardId) });
    await queryClient.invalidateQueries({ queryKey: ["report-card-deliveries", cardId] });
  }

  const save = useMutation({
    mutationFn: () => saveReportCardNarrative(cardId, narrative),
    onSuccess: async () => {
      toast("Comment saved.");
      await reload();
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const refresh = useMutation({
    mutationFn: () => refreshReportCard(cardId),
    onSuccess: async () => {
      toast("Grades refreshed from the gradebook.");
      await reload();
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (narrative !== cardQuery.data?.narrative) {
        await saveReportCardNarrative(cardId, narrative);
      }
      await submitReportCard(cardId);
      try {
        await sendReportCardEmail(cardId);
        return true;
      } catch (error) {
        toastCaughtError(error);
        return false;
      }
    },
    onSuccess: async (emailed) => {
      toast(
        emailed
          ? "Report card sent. Email is on its way."
          : "Report card sent. Email still needs a resend.",
      );
      await reload();
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const resend = useMutation({
    mutationFn: async (deliveryId: number) => {
      await resendReportCardDelivery(deliveryId);
      await sendReportCardEmail(cardId);
    },
    onSuccess: async () => {
      toast("Email queued again.");
      await reload();
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  const remove = useMutation({
    mutationFn: () => deleteReportCard(cardId),
    onSuccess: async () => {
      const studentId = cardQuery.data?.studentProfileId;
      toast("Draft deleted.");
      await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.detail(cardId) });
      if (studentId != null) {
        await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.student(studentId) });
      }
      const courseId = cardQuery.data?.courseId;
      if (courseId != null) {
        await queryClient.invalidateQueries({ queryKey: reportCardQueryKeys.course(courseId) });
      }
      navigate(studentPath(organization.slug, studentId ?? 0));
    },
    onError: (error: Error) => toastCaughtError(error),
  });

  return {
    organization,
    canEdit,
    loading: cardQuery.isLoading,
    card: cardQuery.data ?? null,
    deliveries: deliveriesQuery.data ?? [],
    narrative,
    setNarrative,
    saving: save.isPending,
    refreshing: refresh.isPending,
    submitting: submit.isPending,
    resendingId: resend.isPending ? resend.variables : null,
    saveNarrative: () => save.mutate(),
    refreshGrades: () => refresh.mutate(),
    submitCard: () => submit.mutate(),
    resendDelivery: (id: number) => resend.mutate(id),
    deleting: remove.isPending,
    deleteDraft: () => remove.mutate(),
  };
}
