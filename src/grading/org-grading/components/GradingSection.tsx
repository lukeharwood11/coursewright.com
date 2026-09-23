import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { PageLoading } from "@/ui/PageLoading";
import type { GradingMode } from "@/grading/model/scale";
import { useOrgGrading } from "../hooks/useOrgGrading";

const MODES: { id: GradingMode; label: string; hint: string }[] = [
  { id: "none", label: "Points only", hint: "Show points and percents. No letter or pass/fail." },
  { id: "letter", label: "Letters", hint: "A score gets the highest letter whose minimum it meets." },
  { id: "pass_fail", label: "Pass / fail", hint: "One percent and above is Pass. Below that is Fail." },
];

export function GradingSection() {
  const grading = useOrgGrading();

  if (grading.loading) {
    return <PageLoading embedded label="Loading grading…" />;
  }

  return (
    <section className="max-w-xl">
      <h2 className="text-[15.5px] font-extrabold text-[var(--ink)]">Grading</h2>
      <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        One scale for the whole organization. Teachers use it. They don’t edit it.
        This is separate from grade levels (K–12).
      </p>
      {!grading.canEdit ? (
        <p className="mt-3 text-[14px] text-[var(--ink-soft)]">
          Only owners and admins can change grading.
        </p>
      ) : null}

      <fieldset className="mt-5 flex flex-col gap-2" disabled={!grading.canEdit}>
        <legend className="text-[13px] font-bold text-[var(--ink-soft)]">How grades show</legend>
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
              <span className="block text-[14.5px] font-bold text-[var(--ink)]">{option.label}</span>
              <span className="block text-[13px] text-[var(--ink-soft)]">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {grading.mode === "pass_fail" ? (
        <label className="mt-4 flex max-w-xs flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Pass at or above</span>
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
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">Letters</h3>
            {grading.canEdit ? (
              <button
                type="button"
                className="text-[13px] font-bold text-[var(--green)]"
                onClick={grading.useStarterBands}
              >
                Use A 92 starter
              </button>
            ) : null}
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {grading.bands.map((band, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label={`Letter ${index + 1}`}
                  className="w-24"
                  value={band.label}
                  disabled={!grading.canEdit}
                  onChange={(event) => grading.updateBand(index, { label: event.target.value })}
                />
                <span className="text-[13px] text-[var(--ink-soft)]">at or above</span>
                <Input
                  aria-label={`Minimum percent ${index + 1}`}
                  className="w-24"
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={String(band.minPercent)}
                  disabled={!grading.canEdit}
                  onChange={(event) =>
                    grading.updateBand(index, { minPercent: Number(event.target.value) })
                  }
                />
                {grading.canEdit ? (
                  <button
                    type="button"
                    className="text-[13px] font-bold text-[var(--ink-soft)]"
                    onClick={() => grading.removeBand(index)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {grading.canEdit ? (
            <Button type="button" variant="secondary" className="mt-3" onClick={grading.addBand}>
              Add a letter
            </Button>
          ) : null}
        </div>
      ) : null}

      {grading.error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {grading.error}
        </p>
      ) : null}

      {grading.canEdit ? (
        <div className="mt-5">
          <Button type="button" disabled={grading.saving} onClick={grading.onSave}>
            {grading.saving ? "Saving…" : "Save grading"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
