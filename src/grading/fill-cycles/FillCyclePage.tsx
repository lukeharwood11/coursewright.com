import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { canManageOrgSettings } from "@/organizations/model/role";
import {
  fillCycleQueryKeys,
  remindFillStaff,
  setFillCycleStatus,
} from "@/grading/databridge/fillCycles";
import {
  dependencyLabel,
  fillTaskPath,
  isSoftPastDue,
  localDateStamp,
  reminderRecipients,
  rollup,
  slotsForCycle,
} from "@/grading/model/fillCycle";
import { fillCyclesPath } from "@/grading/model/paths";
import { Button } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { useFillWorkspace } from "./hooks/useFillWorkspace";

export function FillCyclePage() {
  const { cycleId: cycleIdParam } = useParams();
  const cycleId = Number(cycleIdParam);
  const { organization, role, workspace, loading } = useFillWorkspace();
  const canManage = canManageOrgSettings(role);
  const queryClient = useQueryClient();
  const [reminded, setReminded] = useState(false);

  const cycle = workspace?.cycles.find((item) => item.id === cycleId) ?? null;

  useEffect(() => {
    document.title = cycle ? `${cycle.label} · Fill cycle · Course Wright` : "Fill cycle · Course Wright";
  }, [cycle]);

  const status = useMutation({
    mutationFn: (next: "open" | "closed") => setFillCycleStatus(cycleId, next),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: fillCycleQueryKeys.workspace(organization.id) }),
  });
  const remind = useMutation({
    mutationFn: (recipientUserIds: string[]) =>
      remindFillStaff({
        organizationId: organization.id,
        cycleId,
        recipientUserIds,
      }),
    onSuccess: async () => {
      setReminded(true);
      await queryClient.invalidateQueries({
        queryKey: fillCycleQueryKeys.workspace(organization.id),
      });
    },
  });
  useToastOnError(status.error instanceof Error ? status.error.message : null);
  useToastOnError(remind.error instanceof Error ? remind.error.message : null);

  if (loading || !workspace) return <PageLoading label="Loading fill cycle…" />;

  if (!cycle) {
    return (
      <div className="px-5 py-8 md:px-8">
        <h1 className="text-[24px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          We couldn’t find that fill cycle
        </h1>
      </div>
    );
  }

  const slots = slotsForCycle({
    cycle,
    courses: workspace.courses,
    classes: workspace.classes,
    coursesWithOutcomes: new Set(workspace.coursesWithOutcomes),
    submissions: workspace.submissions,
    scope: workspace.scope,
  });
  const progress = rollup(slots);
  const missing = slots.filter((slot) => !slot.submitted);
  const recipients = reminderRecipients({
    slots,
    courseInstructors: workspace.courseInstructors,
    classLeaders: workspace.classLeaders,
  });
  const pastDue = cycle.status === "open" && isSoftPastDue(cycle.dueOn, localDateStamp());

  return (
    <div>
      <DetailPageHeader
        backTo={fillCyclesPath(organization.slug)}
        backLabel="Back to fill cycles"
        title={cycle.label}
        description={
          cycle.status === "closed"
            ? "Closed. New package submits are blocked. Existing grades, attendance, and outcomes stay editable."
            : "Open. Staff can submit packages. The due date does not lock their work."
        }
      />
      <div className="space-y-6 px-5 py-6 md:px-8">
        <p className="text-[14.5px] text-[var(--ink)]">
          {progress.finished} of {progress.total} packages submitted
          {pastDue ? " · Past due" : ` · Due ${cycle.dueOn}`}
          {cycle.status === "closed" ? " · Closed" : ""}
        </p>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={status.isPending}
              onClick={() => status.mutate(cycle.status === "open" ? "closed" : "open")}
            >
              {cycle.status === "open" ? "Close cycle" : "Reopen cycle"}
            </Button>
            <Button
              type="button"
              disabled={remind.isPending || cycle.status === "closed" || recipients.length === 0}
              onClick={() => remind.mutate(recipients)}
            >
              {remind.isPending ? "Saving…" : "Remind staff"}
            </Button>
          </div>
        ) : null}
        {reminded ? (
          <p className="text-[14px] text-[var(--ink-soft)]">
            Reminder saved. It shows on their home. It does not send email.
          </p>
        ) : null}
        {canManage && missing.length > 0 && recipients.length === 0 ? (
          <p className="text-[14px] text-[var(--ink-soft)]">
            Remaining work has no staff account to remind.
          </p>
        ) : null}
        {missing.length === 0 ? (
          <p className="text-[14.5px] text-[var(--ink-soft)]">
            {progress.total === 0
              ? "Nothing in this cycle is assigned to you."
              : "Every package you can see is submitted."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line)]">
            {missing.map((slot) => (
              <li key={`${slot.kind}-${slot.courseId ?? "c"}-${slot.classId ?? "k"}`}>
                <Link
                  to={fillTaskPath(organization.slug, slot)}
                  className="block px-4 py-3 hover:bg-[var(--green-tint)]"
                >
                  <span className="font-extrabold text-[var(--ink)]">{dependencyLabel(slot.kind)}</span>
                  <span className="text-[var(--ink-soft)]"> · {slot.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
