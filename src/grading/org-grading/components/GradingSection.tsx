import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { useToastOnError } from "@/ui/useToastOnError";
import type { GradingMode } from "@/grading/model/scale";
import { LetterBandsPanel } from "./LetterBandsPanel";
import { useOrgGrading } from "../hooks/useOrgGrading";

const MODES: { id: GradingMode; label: string; hint: string }[] = [
  { id: "none", label: "Points only", hint: "Show points and percents. No letter or pass/fail." },
  { id: "letter", label: "Letters", hint: "A score gets the highest letter whose minimum it meets." },
  { id: "pass_fail", label: "Pass / fail", hint: "One percent and above is Pass. Below that is Fail." },
];

export function GradingSection() {
  const grading = useOrgGrading();
  useToastOnError(grading.error);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Grading</h2>
      {!grading.canEdit ? (
        <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
          Only owners and admins can change grading.
        </p>
      ) : null}

      {grading.loading ? (
        <p className="mt-4 text-[14px] text-[var(--ink-soft)]">Loading grading…</p>
      ) : (
        <>
          <fieldset className="mt-4 flex flex-col gap-2" disabled={!grading.canEdit}>
            <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
              How grades show
            </legend>
            {MODES.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-2 rounded-[8px] border border-[var(--line-soft)] px-3 py-2"
              >
                <input
                  type="radio"
                  name="grading-mode"
                  className="mt-1 accent-[var(--green)]"
                  checked={grading.mode === option.id}
                  onChange={() => grading.setModeAndDefaults(option.id)}
                />
                <span>
                  <span className="block text-[14.5px] font-bold text-[var(--ink)]">
                    {option.label}
                  </span>
                  <span className="block text-[13px] text-[var(--ink-soft)]">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {grading.mode === "pass_fail" ? (
            <label className="mt-4 flex max-w-xs flex-col gap-1">
              <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                Pass at or above
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={grading.passThreshold}
                disabled={!grading.canEdit}
                onChange={(event) => grading.setPassThreshold(event.target.value)}
              />
            </label>
          ) : null}

          {grading.mode === "letter" ? (
            <LetterBandsPanel
              bands={grading.bands}
              presets={grading.presets}
              canEdit={grading.canEdit}
              onApplyPreset={grading.applyPreset}
              onAddBand={grading.addBand}
              onRemoveBand={grading.removeBand}
              onUpdateBand={grading.updateBand}
            />
          ) : null}

          {grading.canEdit ? (
            <div className="mt-5">
              <Button type="button" disabled={grading.saving} onClick={grading.onSave}>
                {grading.saving ? "Saving…" : "Save grading"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
