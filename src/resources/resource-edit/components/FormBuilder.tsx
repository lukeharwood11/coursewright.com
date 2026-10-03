import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { caughtErrorMessage } from "@/ui/toast";
import {
  getOrgFormByItemId,
  orgFormQueryKeys,
  saveOrgFormSchema,
} from "@/resources/databridge/forms";
import {
  FORM_FIELD_KINDS,
  FORM_SUBJECT_MODES,
  blankFormField,
  formFieldKindLabel,
  normalizeFormSchema,
  validateFormSchema,
  type FormField,
  type FormFieldKind,
  type FormSubjectMode,
  type OrgFormSchema,
} from "@/resources/model/formSchema";

const labelClass = "block text-[13px] font-bold text-[var(--ink-soft)]";

export function FormBuilder({ itemId }: { itemId: number }) {
  const queryClient = useQueryClient();
  const formQuery = useQuery({
    queryKey: orgFormQueryKeys.byItem(itemId),
    queryFn: () => getOrgFormByItemId(itemId),
  });
  const [schema, setSchema] = useState<OrgFormSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    if (!formQuery.data) return;
    setSchema(formQuery.data.schema);
  }, [formQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!formQuery.data || !schema) throw new Error("This form isn’t ready yet.");
      const next = normalizeFormSchema(schema);
      const message = validateFormSchema(next);
      if (message) throw new Error(message);
      return saveOrgFormSchema(formQuery.data.id, next);
    },
    onSuccess: async (saved) => {
      setSchema(saved.schema);
      setError(null);
      setSavedNote("Questions saved.");
      await queryClient.invalidateQueries({ queryKey: orgFormQueryKeys.byItem(itemId) });
    },
    onError: (caught: Error) => {
      setSavedNote(null);
      setError(caughtErrorMessage(caught));
    },
  });

  if (formQuery.isLoading || !schema) {
    return (
      <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">
        Loading questions…
      </p>
    );
  }

  if (formQuery.isError) {
    return (
      <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">
        {formQuery.error.message}
      </p>
    );
  }

  if (!formQuery.data) {
    return (
      <p className="px-5 py-6 text-[14px] text-[var(--ink-soft)] md:px-8">
        This form isn’t ready yet. Apply the forms migration, then open it again.
      </p>
    );
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setSavedNote(null);
    setSchema((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field) =>
              field.id === id ? { ...field, ...patch } : field,
            ),
          }
        : current,
    );
  }

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
          onChange={(event) => {
            setSavedNote(null);
            setSchema({ ...schema, subject: event.target.value as FormSubjectMode });
          }}
        >
          {FORM_SUBJECT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode === "none"
                ? "Don’t ask"
                : mode === "optional"
                  ? "Optional"
                  : "Required"}
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
                  onChange={(event) => updateField(field.id, { label: event.target.value })}
                />
              </label>
              <label className={`${labelClass} w-44`}>
                Type
                <Select
                  wrapperClassName="mt-1 block w-full"
                  value={field.kind}
                  onChange={(event) => {
                    const kind = event.target.value as FormFieldKind;
                    updateField(field.id, {
                      kind,
                      options: kind === "choice" ? field.options : [],
                    });
                  }}
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
                  onChange={(event) => updateField(field.id, { required: event.target.checked })}
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
                  onChange={(event) =>
                    updateField(field.id, {
                      options: event.target.value.split("\n"),
                    })
                  }
                />
              </label>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={index === 0}
                onClick={() => {
                  setSchema((current) => {
                    if (!current) return current;
                    const fields = [...current.fields];
                    const previous = fields[index - 1];
                    const currentField = fields[index];
                    if (!previous || !currentField) return current;
                    fields[index - 1] = currentField;
                    fields[index] = previous;
                    return { ...current, fields };
                  });
                }}
              >
                Move up
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={index === schema.fields.length - 1}
                onClick={() => {
                  setSchema((current) => {
                    if (!current) return current;
                    const fields = [...current.fields];
                    const next = fields[index + 1];
                    const currentField = fields[index];
                    if (!next || !currentField) return current;
                    fields[index + 1] = currentField;
                    fields[index] = next;
                    return { ...current, fields };
                  });
                }}
              >
                Move down
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSavedNote(null);
                  setSchema({
                    ...schema,
                    fields: schema.fields.filter((item) => item.id !== field.id),
                  });
                }}
              >
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
          onClick={() => {
            setSavedNote(null);
            setSchema({ ...schema, fields: [...schema.fields, blankFormField()] });
          }}
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Add question
        </Button>
        <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save questions"}
        </Button>
        {savedNote ? <p className="text-[13px] font-bold text-[var(--green-deep)]">{savedNote}</p> : null}
      </div>
      {error ? <p className="mt-3 text-[13px] font-bold text-[var(--ink)]">{error}</p> : null}
    </div>
  );
}
