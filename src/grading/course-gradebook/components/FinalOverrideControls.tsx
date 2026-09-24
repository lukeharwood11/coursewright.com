import { Button } from "@/ui/Button";
import { Select } from "@/ui/Select";
import type { GradingScale } from "@/grading/model/scale";

export function FinalOverrideControls({
  studentName,
  scale,
  draft,
  hasOverride,
  saving,
  onDraftChange,
  onSave,
  onClear,
}: {
  studentName: string;
  scale: GradingScale;
  draft: { label: string; note: string };
  hasOverride: boolean;
  saving: boolean;
  onDraftChange: (draft: { label: string; note: string }) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  if (scale.mode === "none") return null;

  return (
    <div className="flex flex-col gap-2">
      <Select
        aria-label={`Final for ${studentName}`}
        value={draft.label}
        onChange={(event) => onDraftChange({ ...draft, label: event.target.value })}
      >
        <option value="">Use the average</option>
        {scale.mode === "pass_fail" ? (
          <>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </>
        ) : (
          scale.bands.map((band) => (
            <option key={band.label} value={band.label}>
              {band.label}
            </option>
          ))
        )}
      </Select>
      <textarea
        aria-label={`Note for ${studentName}`}
        className="min-h-16 w-full rounded-[6px] border border-[var(--line)] px-2 py-1 text-[13px]"
        value={draft.note}
        onChange={(event) => onDraftChange({ ...draft, note: event.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={saving || !draft.label} onClick={onSave}>
          Save final
        </Button>
        {hasOverride ? (
          <Button type="button" variant="secondary" disabled={saving} onClick={onClear}>
            Use the average
          </Button>
        ) : null}
      </div>
    </div>
  );
}
