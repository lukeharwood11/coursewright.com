import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { caughtErrorMessage } from "@/ui/toast";
import {
  getOrgFormByItemId,
  orgFormQueryKeys,
  saveOrgFormSchema,
} from "@/resources/databridge/forms";
import {
  appendFormField,
  formFieldOptionsFromText,
  moveFormField,
  normalizeFormSchema,
  patchFormField,
  removeFormField,
  validateFormSchema,
  withFormSubject,
  type FormField,
  type FormFieldKind,
  type FormSubjectMode,
  type OrgFormSchema,
} from "@/resources/model/formSchema";

export function useFormBuilder(itemId: number) {
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

  function change(next: OrgFormSchema | null, clearNote: boolean) {
    if (clearNote) setSavedNote(null);
    setSchema(next);
  }

  return {
    showLoading: formQuery.isLoading || schema === null,
    loadError: formQuery.isError ? formQuery.error.message : null,
    missing: !formQuery.isLoading && !formQuery.isError && !formQuery.data,
    schema,
    savedNote,
    error,
    saving: save.isPending,
    setSubject: (subject: FormSubjectMode) => {
      if (!schema) return;
      change(withFormSubject(schema, subject), true);
    },
    updateField: (id: string, patch: Partial<FormField>) => {
      if (!schema) return;
      change(patchFormField(schema, id, patch), true);
    },
    setFieldKind: (id: string, kind: FormFieldKind, options: string[]) => {
      if (!schema) return;
      change(
        patchFormField(schema, id, { kind, options: kind === "choice" ? options : [] }),
        true,
      );
    },
    setFieldOptions: (id: string, text: string) => {
      if (!schema) return;
      change(patchFormField(schema, id, { options: formFieldOptionsFromText(text) }), true);
    },
    moveField: (index: number, direction: -1 | 1) => {
      if (!schema) return;
      change(moveFormField(schema, index, direction), false);
    },
    removeField: (id: string) => {
      if (!schema) return;
      change(removeFormField(schema, id), true);
    },
    addField: () => {
      if (!schema) return;
      change(appendFormField(schema), true);
    },
    save: () => save.mutate(),
  };
}

export type FormBuilderModel = ReturnType<typeof useFormBuilder>;
