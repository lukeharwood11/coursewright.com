import { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import {
  remainingDaysForWeek,
  weekdayDateLabel,
  type LessonPlanDayDraft,
} from "@/lesson-plans/model/validate";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { UnitRecord } from "@/units/databridge/units";
import { OrgDayTypeIcons } from "@/organizations/components/OrgDayTypeIcons";
import { DEFAULT_HOME_DAYS, type HomeDay } from "@/organizations/model/homeDays";
import { DEFAULT_SCHOOL_DAYS, type SchoolDay } from "@/organizations/model/schoolDays";
import { AddDayModal } from "./AddDayModal";
import { LinkMaterialsModal } from "./LinkMaterialsModal";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function LessonPlanFormFields({
  title,
  weekNote,
  weekStart,
  days,
  materials,
  units,
  onTitle,
  onWeekNote,
  onWeekStart,
  onDayBody,
  onToggleMaterial,
  onAddDay,
  schoolDays = DEFAULT_SCHOOL_DAYS,
  homeDays = DEFAULT_HOME_DAYS,
}: {
  title: string;
  weekNote: string;
  weekStart: string;
  days: LessonPlanDayDraft[];
  materials: MaterialRecord[];
  units: UnitRecord[];
  onTitle: (value: string) => void;
  onWeekNote: (value: string) => void;
  onWeekStart: (value: string) => void;
  onDayBody: (date: string, body: string) => void;
  onToggleMaterial: (date: string, materialId: number) => void;
  onAddDay: (date: string) => void;
  schoolDays?: readonly SchoolDay[];
  homeDays?: readonly HomeDay[];
}) {
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [linkDay, setLinkDay] = useState<string | null>(null);
  const materialsById = new Map(materials.map((material) => [material.id, material]));
  const remaining = remainingDaysForWeek(
    weekStart,
    days.map((day) => day.date),
  );
  const linkDayDraft = days.find((day) => day.date === linkDay) ?? null;

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input
          className="w-full"
          required
          value={title}
          onChange={(event) => onTitle(event.target.value)}
          placeholder="This week in Biology"
        />
      </label>
      <label className="mt-4 flex min-w-0 flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Week</span>
        <Input
          className="w-full"
          type="date"
          required
          value={weekStart}
          onChange={(event) => onWeekStart(event.target.value)}
        />
        <span className="text-[12.5px] text-[var(--ink-faint)]">
          Starts on Sunday. Families see this on that week’s calendar after you publish.
        </span>
      </label>
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Week note (optional)
        </span>
        <textarea
          className={`${controlClass} min-h-[5rem] resize-y`}
          value={weekNote}
          onChange={(event) => onWeekNote(event.target.value)}
          placeholder="A note for the whole week, even if some days are empty."
        />
      </label>

      <div className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
        {days.map((day) => {
          const linked = day.materialIds
            .map((id) => materialsById.get(id))
            .filter((material): material is MaterialRecord => material != null);
          return (
            <section
              key={day.date}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-4"
            >
              <h3 className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--ink)]">
                {weekdayDateLabel(day.date)}
                <OrgDayTypeIcons
                  date={day.date}
                  schoolDays={schoolDays}
                  homeDays={homeDays}
                />
              </h3>
              <textarea
                className={`${controlClass} mt-2 min-h-[7rem] resize-y text-[13.5px]`}
                value={day.body}
                onChange={(event) => onDayBody(day.date, event.target.value)}
                placeholder="What’s happening this day?"
                aria-label={`Plan for ${weekdayDateLabel(day.date)}`}
              />
              <div className="my-3 border-t border-[var(--line)]" />
              <p className="text-[12px] font-bold text-[var(--ink-soft)]">Materials</p>
              {linked.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {linked.map((material) => (
                    <li
                      key={material.id}
                      className="flex items-start justify-between gap-2 rounded-[6px] border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1.5"
                    >
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-semibold text-[var(--ink)]">
                          {material.title}
                        </span>
                        {material.visibility !== "published" ? (
                          <span className="text-[11.5px] font-bold text-[var(--amber-deep)]">
                            Unpublished
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 rounded-[4px] p-0.5 text-[var(--ink-faint)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                        aria-label={`Remove ${material.title}`}
                        onClick={() => onToggleMaterial(day.date, material.id)}
                      >
                        <XMarkIcon className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                  No materials linked yet.
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                fullWidth
                className="mt-2"
                onClick={() => setLinkDay(day.date)}
              >
                <PlusIcon className="h-4 w-4" aria-hidden />
                Link materials
              </Button>
            </section>
          );
        })}
      </div>
      {remaining.length > 0 ? (
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={() => setAddDayOpen(true)}>
            <PlusIcon className="h-5 w-5" aria-hidden />
            Add another day
          </Button>
        </div>
      ) : null}

      <AddDayModal
        open={addDayOpen}
        dates={remaining}
        onSelect={onAddDay}
        onClose={() => setAddDayOpen(false)}
      />
      <LinkMaterialsModal
        open={linkDay != null}
        dayLabel={linkDay ? weekdayDateLabel(linkDay) : ""}
        materials={materials}
        units={units}
        selectedIds={linkDayDraft?.materialIds ?? []}
        onToggle={(materialId) => {
          if (linkDay) onToggleMaterial(linkDay, materialId);
        }}
        onClose={() => setLinkDay(null)}
      />
    </>
  );
}
