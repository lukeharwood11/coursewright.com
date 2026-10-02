import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { canManageOrgSettings } from "@/organizations/model/role";
import { createFillCycle, fillCycleQueryKeys } from "@/grading/databridge/fillCycles";
import {
  localDateStamp,
  validateFillCycleDraft,
  type FillAudience,
} from "@/grading/model/fillCycle";
import { fillCyclePath } from "@/grading/model/paths";
import { Button } from "@/ui/Button";
import { DetailPageHeader } from "@/ui/DetailPageHeader";
import { PageLoading } from "@/ui/PageLoading";
import { useToastOnError } from "@/ui/useToastOnError";
import { useFillWorkspace } from "./hooks/useFillWorkspace";

const fieldClass =
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none";

export function FillCyclesPage() {
  const { organization, role, workspace, loading } = useFillWorkspace();
  const canManage = canManageOrgSettings(role);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [dueOn, setDueOn] = useState(localDateStamp());
  const [audience, setAudience] = useState<FillAudience>("organization");
  const [classIds, setClassIds] = useState<number[]>([]);
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [requireGrades, setRequireGrades] = useState(true);
  const [requireAttendance, setRequireAttendance] = useState(true);
  const [requireOutcomes, setRequireOutcomes] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Fill cycles · Course Wright";
  }, []);

  const create = useMutation({
    mutationFn: () =>
      createFillCycle({
        organizationId: organization.id,
        label: label.trim(),
        dueOn,
        audience,
        classIds,
        courseIds,
        requireGrades,
        requireAttendance,
        requireOutcomes,
      }),
    onSuccess: async (cycleId) => {
      await queryClient.invalidateQueries({
        queryKey: fillCycleQueryKeys.workspace(organization.id),
      });
      navigate(fillCyclePath(organization.slug, cycleId));
    },
  });
  useToastOnError(create.error instanceof Error ? create.error.message : null);

  if (loading || !workspace) return <PageLoading label="Loading fill cycles…" />;

  const activeCourses = workspace.courses
    .filter((course) => course.status === "active")
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));
  const classes = workspace.classes.slice().sort((a, b) => a.title.localeCompare(b.title));

  function toggleId(current: number[], id: number, set: (next: number[]) => void) {
    set(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function onCreate() {
    const message = validateFillCycleDraft({
      label,
      dueOn,
      audience,
      classIds,
      courseIds,
      requireGrades,
      requireAttendance,
      requireOutcomes,
    });
    setFormError(message);
    if (message) return;
    create.mutate();
  }

  return (
    <div>
      <DetailPageHeader
        backTo={`/my/${organization.slug}`}
        backLabel="Back to overview"
        title="Fill cycles"
        description="A fill cycle asks staff to submit grades, attendance, and outcomes before a soft due date. Closing it stops new submits. It does not send report cards."
      />
      <div className="space-y-8 px-5 py-6 md:px-8">
        <section aria-label="Cycles">
          {workspace.cycles.length === 0 ? (
            <p className="text-[14.5px] text-[var(--ink-soft)]">No fill cycles yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--line-soft)] rounded-[10px] border border-[var(--line)]">
              {workspace.cycles.map((cycle) => (
                <li key={cycle.id}>
                  <Link
                    to={fillCyclePath(organization.slug, cycle.id)}
                    className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 hover:bg-[var(--green-tint)]"
                  >
                    <span className="font-extrabold text-[var(--ink)]">{cycle.label}</span>
                    <span className="text-[13px] text-[var(--ink-soft)]">
                      Due {cycle.dueOn}
                      {cycle.status === "closed" ? " · Closed" : " · Open"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canManage ? (
          <section aria-label="New fill cycle" className="max-w-xl space-y-4">
            <h2 className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              New fill cycle
            </h2>
            <label className="block">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
              <input
                className={`mt-1 ${fieldClass}`}
                value={label}
                maxLength={80}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">Due date</span>
              <input
                className={`mt-1 ${fieldClass}`}
                type="date"
                value={dueOn}
                onChange={(event) => setDueOn(event.target.value)}
              />
              <span className="mt-1 block text-[13px] text-[var(--ink-soft)]">
                Past due is a reminder only. It does not lock grades, attendance, or outcomes.
              </span>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-bold text-[var(--ink-soft)]">Who is included</legend>
              {(
                [
                  ["organization", "Whole organization"],
                  ["classes", "Selected classes"],
                  ["courses", "Selected courses"],
                ] as const
              ).map(([value, text]) => (
                <label key={value} className="flex items-center gap-2 text-[14.5px]">
                  <input
                    type="radio"
                    name="fill-audience"
                    checked={audience === value}
                    onChange={() => setAudience(value)}
                  />
                  {text}
                </label>
              ))}
            </fieldset>
            {audience === "classes" ? (
              <CheckboxList
                label="Classes"
                empty="No classes yet."
                options={classes.map((classGroup) => ({ id: classGroup.id, title: classGroup.title }))}
                selected={classIds}
                onToggle={(id) => toggleId(classIds, id, setClassIds)}
              />
            ) : null}
            {audience === "courses" ? (
              <CheckboxList
                label="Courses"
                empty="No active courses yet."
                options={activeCourses.map((course) => ({ id: course.id, title: course.title }))}
                selected={courseIds}
                onToggle={(id) => toggleId(courseIds, id, setCourseIds)}
              />
            ) : null}
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-bold text-[var(--ink-soft)]">Packages</legend>
              <PackageToggle label="Grades" checked={requireGrades} onChange={setRequireGrades} />
              <PackageToggle
                label="Attendance"
                checked={requireAttendance}
                onChange={setRequireAttendance}
              />
              <PackageToggle label="Outcomes" checked={requireOutcomes} onChange={setRequireOutcomes} />
              <p className="text-[13px] text-[var(--ink-soft)]">
                Outcomes are skipped for a course that has none. Period feedback stays off until that
                piece is turned on.
              </p>
            </fieldset>
            {formError ? <p className="text-[14px] text-[var(--amber-deep)]">{formError}</p> : null}
            <Button type="button" disabled={create.isPending} onClick={onCreate}>
              {create.isPending ? "Creating…" : "Create fill cycle"}
            </Button>
          </section>
        ) : (
          <p className="text-[14px] text-[var(--ink-soft)]">
            Owners and admins create fill cycles. You can still open one to see your work.
          </p>
        )}
      </div>
    </div>
  );
}

function PackageToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[14.5px]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function CheckboxList({
  label,
  empty,
  options,
  selected,
  onToggle,
}: {
  label: string;
  empty: string;
  options: { id: number; title: string }[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-1 text-[14px] text-[var(--ink-soft)]">{empty}</p>
      ) : (
        <ul className="mt-2 max-h-48 space-y-1 overflow-auto rounded-[8px] border border-[var(--line)] p-2">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex items-center gap-2 text-[14.5px]">
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => onToggle(option.id)}
                />
                {option.title}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
