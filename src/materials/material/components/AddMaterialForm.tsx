import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { PlusIcon } from "@heroicons/react/24/outline";
import { MATERIAL_KINDS, materialKindLabel, type MaterialKind } from "@/materials/model/kind";
import { useAddMaterial } from "../hooks/useAddMaterial";
import { AudioSnippetRecorder } from "./AudioSnippetRecorder";
import { MaterialDateFields } from "./MaterialDateFields";
import { browserTimeZone, timeZoneLabel } from "@/submissions/model/dueInstant";

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
  fromUnitPage = false,
  formOnly = false,
  onCancel,
}: {
  organizationId: number;
  orgSlug: string;
  courseId: number;
  unitId: number | null;
  label: string;
  fromUnitPage?: boolean;
  /** Skip the trigger button; parent mounts this only when the form should show. */
  formOnly?: boolean;
  onCancel?: () => void;
}) {
  const { organization } = useOrgShell();
  const add = useAddMaterial({
    organizationId,
    orgSlug,
    courseId,
    unitId,
    fromUnitPage,
  });

  function close() {
    add.setOpen(false);
    onCancel?.();
  }

  if (!formOnly && !add.open) {
    return (
      <Button variant="ghost" fullWidth onClick={() => add.setOpen(true)}>
        <PlusIcon className="h-5 w-5" aria-hidden />
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
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">File</span>
            <input
              type="file"
              className="text-[13.5px] text-[var(--ink-soft)]"
              onChange={(event) => add.setFile(event.target.files?.[0] ?? null)}
            />
            {add.file ? (
              <span className="text-[12px] text-[var(--ink-soft)]">{add.file.name}</span>
            ) : null}
            <span className="text-[12px] text-[var(--ink-faint)]">
              Audio: MP3 or M4A works best on phones. You can also record a clip
              below.
            </span>
          </label>
          <AudioSnippetRecorder file={add.file} onFile={add.setFile} />
        </div>
      ) : null}
      <MaterialDateFields
        scheduledDate={add.scheduledDate}
        dueDate={add.dueDate}
        dueTime={add.dueTime}
        timeZoneLabel={timeZoneLabel(browserTimeZone())}
        schoolDays={organization.schoolDays}
        homeDays={organization.homeDays}
        onScheduledChange={add.setScheduledDate}
        onDueDateChange={add.setDueDate}
        onDueTimeChange={add.setDueTime}
      />
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
          onClick={close}
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
