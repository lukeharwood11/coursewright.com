import { Input } from "@/ui/Input";
import { groupMaterialsForPicker } from "@/bulletins/model/grouping";
import type { MaterialRecord } from "@/materials/databridge/materials";
import type { UnitRecord } from "@/units/databridge/units";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function BulletinFormFields({
  title,
  body,
  startDate,
  endDate,
  materialIds,
  materials,
  units,
  onTitle,
  onBody,
  onStartDate,
  onEndDate,
  onToggleMaterial,
}: {
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  materialIds: number[];
  materials: MaterialRecord[];
  units: UnitRecord[];
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
  onToggleMaterial: (id: number) => void;
}) {
  const groups = groupMaterialsForPicker(materials, units);
  const selected = new Set(materialIds);

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
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Note (optional)</span>
        <textarea
          className={`${controlClass} min-h-[6rem] resize-y`}
          value={body}
          onChange={(event) => onBody(event.target.value)}
          placeholder="A short note families will see with the links."
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Start date</span>
          <Input
            className="w-full"
            type="date"
            required
            value={startDate}
            onChange={(event) => onStartDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">End date</span>
          <Input
            className="w-full"
            type="date"
            required
            value={endDate}
            onChange={(event) => onEndDate(event.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
        Families see this on their home from the start date through the end date.
      </p>

      <fieldset className="mt-6">
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
          Materials
        </legend>
        <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
          Choose what to list when someone opens this note. Unpublished materials
          stay hidden from families until you publish them.
        </p>
        {groups.length === 0 ? (
          <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
            Add materials to this course first, then you can attach them here.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.unitId ?? "top"}>
                <p className="text-[12.5px] font-bold text-[var(--ink-faint)]">
                  {group.unitTitle ?? "Course materials"}
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {group.materials.map((material) => (
                    <li key={material.id}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-[8px] px-2 py-1.5 hover:bg-[var(--green-tint)]">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.has(material.id)}
                          onChange={() => onToggleMaterial(material.id)}
                        />
                        <span>
                          <span className="block text-[14px] font-semibold text-[var(--ink)]">
                            {material.title}
                          </span>
                          {material.visibility !== "published" ? (
                            <span className="text-[12px] font-bold text-[var(--amber-deep)]">
                              Unpublished
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </>
  );
}
