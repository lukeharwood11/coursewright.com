import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  fillCycleQueryKeys,
  fillPackageSubmitted,
  getFillCycle,
  submitFillPackage,
} from "@/grading/databridge/fillCycles";
import {
  dependencyLabel,
  isSoftPastDue,
  localDateStamp,
  type FillDependency,
} from "@/grading/model/fillCycle";
import { Button } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";

export function FillPackageBanner({
  kind,
  courseId = null,
  classId = null,
}: {
  kind: FillDependency;
  courseId?: number | null;
  classId?: number | null;
}) {
  const [searchParams] = useSearchParams();
  const requested = Number(searchParams.get("cycle"));
  const { organization } = useOrgShell();
  const queryClient = useQueryClient();
  const cycleQuery = useQuery({
    queryKey: fillCycleQueryKeys.detail(requested),
    queryFn: () => getFillCycle(requested),
    enabled: Number.isFinite(requested),
  });
  const cycle = cycleQuery.data;
  const enabled =
    cycle != null &&
    ((kind === "grades" && cycle.requireGrades && courseId != null) ||
      (kind === "outcomes" && cycle.requireOutcomes && courseId != null) ||
      (kind === "period_feedback" && cycle.requirePeriodFeedback && courseId != null) ||
      (kind === "attendance" &&
        cycle.requireAttendance &&
        ((courseId != null && cycle.audience !== "classes") ||
          (classId != null && cycle.audience !== "courses"))));

  const submittedQuery = useQuery({
    queryKey: [
      ...fillCycleQueryKeys.detail(cycle?.id ?? 0),
      "submitted",
      kind,
      courseId,
      classId,
    ] as const,
    queryFn: () =>
      fillPackageSubmitted({
        cycleId: cycle?.id ?? 0,
        kind,
        courseId,
        classId,
      }),
    enabled: enabled && cycle != null,
  });

  const submit = useMutation({
    mutationFn: () => {
      if (!cycle || courseId == null && classId == null) {
        throw new Error("This package is not part of the fill cycle.");
      }
      return submitFillPackage({
        organizationId: organization.id,
        cycleId: cycle.id,
        kind,
        courseId,
        classId,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: fillCycleQueryKeys.workspace(organization.id),
      });
      void queryClient.invalidateQueries({
        queryKey: [...fillCycleQueryKeys.detail(cycle?.id ?? 0), "submitted"],
      });
    },
  });
  useToastOnError(submit.error instanceof Error ? submit.error.message : null);
  useToastOnError(cycleQuery.error instanceof Error ? cycleQuery.error.message : null);
  useToastOnError(submittedQuery.error instanceof Error ? submittedQuery.error.message : null);

  if (!enabled || !cycle) return null;

  const pastDue = isSoftPastDue(cycle.dueOn, localDateStamp());
  const closed = cycle.status === "closed";
  const alreadySubmitted = submittedQuery.data === true || submit.isSuccess;

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3">
      <p className="text-[14px] text-[var(--ink)]">
        <span className="font-extrabold">{cycle.label}</span>
        {" · "}
        {dependencyLabel(kind)} package
        {pastDue ? " · Past due" : ` · Due ${cycle.dueOn}`}
      </p>
      <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
        {closed
          ? "This fill cycle is closed."
          : alreadySubmitted
            ? "Submitted. You can still edit, and you can submit again to refresh the checkpoint."
            : "Submit when this looks right. You can still edit afterward, and the due date does not lock anything."}
      </p>
      {closed ? null : (
        <Button className="mt-3" type="button" disabled={submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending
            ? "Submitting…"
            : alreadySubmitted
              ? "Submit again"
              : `Submit ${dependencyLabel(kind).toLowerCase()}`}
        </Button>
      )}
    </div>
  );
}
