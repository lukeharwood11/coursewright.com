import { Input } from "@/ui/Input";
import { groupMaterialsForPicker } from "@/lesson-plans/model/materials";
import { weekdayDateLabel, type LessonPlanDayDraft } from "@/lesson-plans/model/validate";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { UnitRecord } from "@/units/databridge/units";

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
}) {
  const groups = groupMaterialsForPicker(materials, units);

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
      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Week</span>
        <Input
          className="w-full max-w-xs"
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
          const selected = new Set(day.materialIds);
          return (
            <section
              key={day.date}
              className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-4"
            >
              <h3 className="text-[12.5px] font-bold text-[var(--ink)]">
                {weekdayDateLabel(day.date)}
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
              {groups.length === 0 ? (
                <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                  Add materials to this course first.
                </p>
              ) : (
                <ul className="mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {groups.flatMap((group) =>
                    group.materials.map((material) => (
                      <li key={`${day.date}-${material.id}`}>
                        <label className="flex cursor-pointer items-start gap-1.5 text-[12.5px]">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selected.has(material.id)}
                            onChange={() => onToggleMaterial(day.date, material.id)}
                          />
                          <span>
                            <span className="block font-semibold text-[var(--ink)]">
                              {material.title}
                            </span>
                            {material.visibility !== "published" ? (
                              <span className="font-bold text-[var(--amber-deep)]">
                                Unpublished
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    )),
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
