import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import {
  formatPercentNumber,
  letterBandRanges,
  matchingLetterPresetId,
  type LetterBand,
  type LetterBandPreset,
  type LetterBandRange,
} from "@/grading/model/scale";

function BandRangeChips({
  ranges,
  dense = false,
}: {
  ranges: LetterBandRange[];
  dense?: boolean;
}) {
  return (
    <ul className={["flex flex-wrap", dense ? "gap-1" : "gap-1.5"].join(" ")}>
      {ranges.map((range) => (
        <li
          key={`${range.label}-${range.minPercent}`}
          className={[
            "inline-flex items-baseline gap-1 rounded-[6px] border border-[var(--line-soft)] bg-[var(--surface)]",
            dense ? "px-1.5 py-0.5 text-[12px]" : "px-2 py-1 text-[13px]",
          ].join(" ")}
        >
          <span className="font-extrabold text-[var(--ink)]">{range.label}</span>
          <span className="font-semibold text-[var(--ink-soft)]">
            {range.minPercent === range.maxPercent
              ? formatPercentNumber(range.minPercent)
              : `${formatPercentNumber(range.minPercent)}–${formatPercentNumber(range.maxPercent)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LetterBandsPanel({
  bands,
  presets,
  canEdit,
  onApplyPreset,
  onAddBand,
  onRemoveBand,
  onUpdateBand,
}: {
  bands: LetterBand[];
  presets: LetterBandPreset[];
  canEdit: boolean;
  onApplyPreset: (presetId: string) => void;
  onAddBand: () => void;
  onRemoveBand: (index: number) => void;
  onUpdateBand: (index: number, patch: Partial<LetterBand>) => void;
}) {
  const [customizing, setCustomizing] = useState(false);
  const matchedPresetId = matchingLetterPresetId(bands);
  const ranges = letterBandRanges(bands);

  function applyPreset(presetId: string) {
    onApplyPreset(presetId);
    setCustomizing(false);
  }

  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">Letters</h3>

      {canEdit ? (
        <fieldset className="mt-2">
          <legend className="text-[13px] text-[var(--ink-soft)]">Presets</legend>
          <div className="mt-2 flex flex-col gap-2">
            {presets.map((preset) => {
              const selected = matchedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyPreset(preset.id)}
                  className={[
                    "rounded-[8px] border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-[var(--green)] bg-[var(--green-tint)]"
                      : "border-[var(--line-soft)] hover:border-[var(--line)]",
                  ].join(" ")}
                >
                  <span className="block text-[14.5px] font-bold text-[var(--ink)]">
                    {preset.label}
                  </span>
                  <span className="mt-2 block">
                    <BandRangeChips ranges={letterBandRanges(preset.bands)} dense />
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-bold text-[var(--ink-soft)]">
            {matchedPresetId ? "This scale" : "Custom scale"}
          </p>
          {canEdit ? (
            <button
              type="button"
              className="text-[13px] font-bold text-[var(--green)]"
              onClick={() => setCustomizing((open) => !open)}
            >
              {customizing ? "Done customizing" : "Customize"}
            </button>
          ) : null}
        </div>

        {!customizing ? (
          ranges.length === 0 ? (
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">No letters yet.</p>
          ) : (
            <div className="mt-2">
              <BandRangeChips ranges={ranges} />
            </div>
          )
        ) : (
          <div className="mt-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[16rem] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--line-soft)] text-[12.5px] text-[var(--ink-soft)]">
                    <th className="py-1.5 pr-2 font-bold">Letter</th>
                    <th className="py-1.5 pr-2 font-bold">Min %</th>
                    <th className="py-1.5 font-bold">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bands.map((band, index) => (
                    <tr key={index} className="border-b border-[var(--line-soft)]">
                      <td className="py-1.5 pr-2">
                        <Input
                          aria-label={`Letter ${index + 1}`}
                          className="w-20"
                          value={band.label}
                          onChange={(event) =>
                            onUpdateBand(index, { label: event.target.value })
                          }
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <Input
                          aria-label={`Minimum percent ${index + 1}`}
                          className="w-20"
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={String(band.minPercent)}
                          onChange={(event) =>
                            onUpdateBand(index, { minPercent: Number(event.target.value) })
                          }
                        />
                      </td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          className="text-[13px] font-bold text-[var(--ink-soft)]"
                          onClick={() => onRemoveBand(index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="secondary" className="mt-3" onClick={onAddBand}>
              Add a letter
            </Button>
            <p className="mt-2 text-[12.5px] text-[var(--ink-soft)]">
              One letter must start at 0. A score gets the highest letter whose minimum it meets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
