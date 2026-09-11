import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { MATERIAL_KINDS, materialKindLabel, type MaterialKind } from "@/materials/model/kind";
import { useAddMaterial } from "../hooks/useAddMaterial";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

export function AddMaterialForm({
  organizationId,
  orgSlug,
  courseId,
  unitId,
  label,
}: {
  organizationId: number;
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  label: string;
}) {
  const add = useAddMaterial({ organizationId, orgSlug, courseId, unitId });

  if (!add.open) {
    return (
      <Button variant="ghost" fullWidth onClick={() => add.setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form
      onSubmit={add.onSubmit}
      className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4"
    >
      <p className="text-[13px] font-bold text-[var(--ink-soft)]">Add material</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MATERIAL_KINDS.map((kind) => (
          <KindButton
            key={kind}
            kind={kind}
            selected={add.kind === kind}
            onSelect={add.setKind}
          />
        ))}
      </div>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Title</span>
        <Input
          className="w-full"
          required
          value={add.title}
          onChange={(event) => add.setTitle(event.target.value)}
        />
      </label>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Description</span>
        <textarea
          className={`${controlClass} min-h-[4.5rem] resize-y`}
          value={add.description}
          onChange={(event) => add.setDescription(event.target.value)}
        />
      </label>
      {add.kind === "link" ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Web address</span>
          <Input
            className="w-full"
            value={add.url}
            onChange={(event) => add.setUrl(event.target.value)}
            placeholder="https://"
          />
        </label>
      ) : null}
      {add.kind === "file" ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">File</span>
          <input
            type="file"
            className="text-[13.5px] text-[var(--ink-soft)]"
            onChange={(event) => add.setFile(event.target.files?.[0] ?? null)}
          />
        </label>
      ) : null}
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Date for this week (optional)
        </span>
        <Input
          className="w-full"
          type="date"
          value={add.scheduledDate}
          onChange={(event) => add.setScheduledDate(event.target.value)}
        />
      </label>
      {add.formError ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {add.formError}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" disabled={add.submitting}>
          {add.submitting ? "Adding…" : "Add material"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => add.setOpen(false)}
          disabled={add.submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function KindButton({
  kind,
  selected,
  onSelect,
}: {
  kind: MaterialKind;
  selected: boolean;
  onSelect: (kind: MaterialKind) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(kind)}
      className={[
        "rounded-full px-3 py-1 text-[12px] font-bold",
        selected
          ? "bg-[var(--green-tint)] text-[var(--green-deep)]"
          : "bg-[var(--line-soft)] text-[var(--ink-soft)]",
      ].join(" ")}
    >
      {materialKindLabel(kind)}
    </button>
  );
}
