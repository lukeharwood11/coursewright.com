import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import {
  FORM_FIELD_KINDS,
  FORM_SUBJECT_MODES,
  formFieldKindLabel,
  type FormFieldKind,
  type FormSubjectMode,
} from "@/resources/model/formSchema";
import type { FormBuilderModel } from "../hooks/useFormBuilder";

const labelClass = "block text-[13px] font-bold text-[var(--ink-soft)]";

export function FormBuilderView({ builder }: { builder: FormBuilderModel }) {
  if (builder.showLoading || !builder.schema) {
    return (
      <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">Loading questions…</p>
    );
  }

  if (builder.loadError) {
    return (
      <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">{builder.loadError}</p>
    );
  }

  if (builder.missing) {
    return (
      <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">
        This form isn’t ready yet. Apply the forms migration, then open it again.
      </p>
    );
  }

  const schema = builder.schema;

  return (
    <div className="px-5 py-6 md:px-8">
      <p className="max-w-xl text-[14px] text-[var(--ink-soft)]">
        Questions on this form. Publish it from the form page when people should respond.
        There is no branching.
      </p>

      <label className={`${labelClass} mt-5 max-w-md`}>
        Student this response is about
        <Select
          wrapperClassName="mt-1 block w-full"
          value={schema.subject}
          onChange={(event) => builder.setSubject(event.target.value as FormSubjectMode)}
        >
          {FORM_SUBJECT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode === "none" ? "Don’t ask" : mode === "optional" ? "Optional" : "Required"}
            </option>
          ))}
        </Select>
      </label>

      <ol className="mt-6 space-y-3">
        {schema.fields.map((field, index) => (
          <li
            key={field.id}
            className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          >
            <div className="flex flex-wrap items-end gap-3">
              <label className={`${labelClass} min-w-[12rem] flex-1`}>
                Question
                <Input
                  className="mt-1 w-full"
                  value={field.label}
                  placeholder="Question"
                  onChange={(event) => builder.updateField(field.id, { label: event.target.value })}
                />
              </label>
              <label className={`${labelClass} w-44`}>
                Type
                <Select
                  wrapperClassName="mt-1 block w-full"
                  value={field.kind}
                  onChange={(event) =>
                    builder.setFieldKind(field.id, event.target.value as FormFieldKind, field.options)
                  }
                >
                  {FORM_FIELD_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {formFieldKindLabel(kind)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--ink)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--green)]"
                  checked={field.required}
                  onChange={(event) =>
                    builder.updateField(field.id, { required: event.target.checked })
                  }
                />
                Required
              </label>
            </div>
            {field.kind === "choice" ? (
              <label className={`${labelClass} mt-3`}>
                Options, one per line
                <textarea
                  className="mt-1 min-h-24 w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]"
                  value={field.options.join("\n")}
                  onChange={(event) => builder.setFieldOptions(field.id, event.target.value)}
                />
              </label>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={index === 0}
                onClick={() => builder.moveField(index, -1)}
              >
                Move up
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={index === schema.fields.length - 1}
                onClick={() => builder.moveField(index, 1)}
              >
                Move down
              </Button>
              <Button type="button" variant="secondary" onClick={() => builder.removeField(field.id)}>
                <TrashIcon className="h-4 w-4" aria-hidden />
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={schema.fields.length >= 40}
          onClick={() => builder.addField()}
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Add question
        </Button>
        <Button type="button" disabled={builder.saving} onClick={() => builder.save()}>
          {builder.saving ? "Saving…" : "Save questions"}
        </Button>
        {builder.savedNote ? (
          <p className="text-[13px] font-bold text-[var(--green-deep)]">{builder.savedNote}</p>
        ) : null}
      </div>
      {builder.error ? (
        <p className="mt-3 text-[13px] font-bold text-[var(--ink)]">{builder.error}</p>
      ) : null}
    </div>
  );
}
