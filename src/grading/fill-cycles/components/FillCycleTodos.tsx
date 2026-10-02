import { Link } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { canManageOrgSettings } from "@/organizations/model/role";
import {
  dependencyLabel,
  fillTaskPath,
  isSoftPastDue,
  localDateStamp,
  rollup,
  slotsForCycle,
  tasksForUser,
} from "@/grading/model/fillCycle";
import { fillCyclePath, fillCyclesPath } from "@/grading/model/paths";
import { useFillWorkspace } from "../hooks/useFillWorkspace";

export function FillCycleTodos() {
  const { organization, role, workspace, loading } = useFillWorkspace();
  const user = useAuthedUser();
  if (loading || !workspace) return null;

  const today = localDateStamp();
  const canManage = canManageOrgSettings(role);
  const myCourseIds = new Set(
    workspace.courseInstructors
      .filter((row) => row.userId === user.id)
      .map((row) => row.courseId),
  );
  const myClassIds = new Set(
    workspace.classLeaders.filter((row) => row.userId === user.id).map((row) => row.classId),
  );
  const open = workspace.cycles.filter((cycle) => cycle.status === "open");
  const blocks = open.flatMap((cycle) => {
    const slots = slotsForCycle({
      cycle,
      courses: workspace.courses,
      classes: workspace.classes,
      coursesWithOutcomes: new Set(workspace.coursesWithOutcomes),
      submissions: workspace.submissions,
      scope: workspace.scope,
    });
    const tasks = tasksForUser(slots, { courseIds: myCourseIds, classIds: myClassIds });
    const leadsThisCycle = slots.some(
      (slot) => slot.classId != null && myClassIds.has(slot.classId),
    );
    const showRollup = canManage || leadsThisCycle;
    const reminder = workspace.reminders.find(
      (row) => row.cycleId === cycle.id && row.recipientUserId === user.id,
    );
    if (tasks.length === 0 && !showRollup && !reminder) return [];
    return [{ cycle, slots, tasks, showRollup, reminder: reminder != null }];
  });

  if (!canManage && blocks.length === 0) return null;

  return (
    <section aria-label="Fill cycles">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-extrabold text-[var(--ink-soft)]">Fill cycles</h2>
        <Link
          to={fillCyclesPath(organization.slug)}
          className="text-[13px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          {canManage ? "Manage" : "View"}
        </Link>
      </div>
      {blocks.length === 0 ? (
        <p className="mt-3 text-[14.5px] text-[var(--ink-soft)]">No open fill cycles.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {blocks.map(({ cycle, slots, tasks, showRollup, reminder }) => {
            const progress = rollup(slots);
            const pastDue = isSoftPastDue(cycle.dueOn, today);
            return (
              <li
                key={cycle.id}
                className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4"
              >
                <p className="text-[14.5px] text-[var(--ink)]">
                  <Link
                    to={fillCyclePath(organization.slug, cycle.id)}
                    className="font-extrabold hover:text-[var(--green-deep)]"
                  >
                    {cycle.label}
                  </Link>
                  {pastDue ? (
                    <span className="text-[var(--amber-deep)]"> · Past due</span>
                  ) : (
                    <span className="text-[var(--ink-soft)]"> · Due {cycle.dueOn}</span>
                  )}
                </p>
                {reminder ? (
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                    Reminder: please finish the packages still open for you.
                  </p>
                ) : null}
                {showRollup ? (
                  <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                    {progress.finished} of {progress.total} packages submitted
                  </p>
                ) : null}
                {tasks.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {tasks.map((slot) => (
                      <li key={`${slot.kind}-${slot.courseId ?? "c"}-${slot.classId ?? "k"}`}>
                        <Link
                          to={fillTaskPath(organization.slug, slot)}
                          className="text-[14px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
                        >
                          {dependencyLabel(slot.kind)} · {slot.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
