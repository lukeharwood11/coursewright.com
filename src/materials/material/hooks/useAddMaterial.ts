import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { createMaterial, materialQueryKeys } from "@/materials/databridge/materials";
import { uploadNewFile } from "@/materials/databridge/files";
import { materialEditPath, materialPath } from "@/materials/model/paths";
import { validateMaterialFields } from "@/materials/model/validate";
import type { MaterialKind } from "@/materials/model/kind";

export function useAddMaterial(args: {
  organizationId: number;
  orgSlug: string;
  courseId: number;
  unitId: number | null;
}) {
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MaterialKind>("page");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = validateMaterialFields({
        title,
        description,
        kind,
        url,
        scheduledDate,
        dueDate,
      });
      if (!parsed.ok) throw new Error(parsed.error);
      if (kind === "file" && !file) {
        throw new Error("Choose a file to attach.");
      }
      let fileId: number | null = null;
      if (kind === "file" && file) {
        const uploaded = await uploadNewFile({
          organizationId: args.organizationId,
          uploadedBy: user.id,
          file,
        });
        fileId = uploaded.id;
      }
      return createMaterial({
        organizationId: args.organizationId,
        courseId: args.courseId,
        unitId: args.unitId,
        input: parsed.value,
        fileId,
      });
    },
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({
        queryKey: materialQueryKeys.list(args.courseId),
      });
      if (args.unitId != null) {
        await queryClient.invalidateQueries({
          queryKey: materialQueryKeys.unit(args.unitId),
        });
      }
      reset();
      setOpen(false);
      const pathArgs = {
        orgSlug: args.orgSlug,
        courseId: args.courseId,
        unitId: args.unitId,
        materialId: material.id,
      };
      navigate(
        material.kind === "page"
          ? materialEditPath(pathArgs)
          : materialPath(pathArgs),
      );
    },
    onError: (error: Error) => setFormError(error.message),
  });

  function reset() {
    setKind("page");
    setTitle("");
    setDescription("");
    setUrl("");
    setScheduledDate("");
    setDueDate("");
    setFile(null);
    setFormError(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    mutation.mutate();
  }

  return {
    open,
    setOpen,
    kind,
    setKind,
    title,
    setTitle,
    description,
    setDescription,
    url,
    setUrl,
    scheduledDate,
    setScheduledDate,
    dueDate,
    setDueDate,
    file,
    setFile,
    formError,
    submitting: mutation.isPending,
    onSubmit,
  };
}
