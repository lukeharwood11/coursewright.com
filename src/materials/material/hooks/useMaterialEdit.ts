import { useEffect, useState } from "react";
import type { SerializedEditorState } from "lexical";
import { saveMaterialPage } from "@/materials/databridge/saveMaterialPage";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import { useMaterial } from "./useMaterial";

const MATERIAL_EDIT_FORM_ID = "material-edit-form";

export function useMaterialEdit() {
  const page = useMaterial();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentBaseline, setContentBaseline] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<string | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [baselineReady, setBaselineReady] = useState(false);

  useEffect(() => {
    setBaselineReady(false);
    setContentBaseline(null);
    setContentDraft(null);
  }, [page.material?.id]);

  useEffect(() => {
    if (!page.material) return;
    setTitle(page.material.title);
    setDescription(page.material.description);
    setUrl(page.material.url ?? "");
    setScheduledDate(page.material.scheduledDate ?? "");
    setDueDate(page.material.dueDate ?? "");
  }, [page.material]);

  const placementChanged = Boolean(
    page.material &&
      (title !== page.material.title ||
        description !== page.material.description ||
        (page.material.kind === "link" && url !== (page.material.url ?? "")) ||
        scheduledDate !== (page.material.scheduledDate ?? "") ||
        dueDate !== (page.material.dueDate ?? "")),
  );

  const contentChanged =
    page.material?.kind === "page" &&
    baselineReady &&
    contentDraft !== null &&
    contentBaseline !== null &&
    contentDraft !== contentBaseline;

  function onDraftChange(json: string) {
    if (!baselineReady) {
      setContentBaseline(json);
      setContentDraft(json);
      setBaselineReady(true);
      return;
    }
    setContentDraft(json);
  }

  async function save() {
    if (!page.material) return;
    if (!placementChanged && !contentChanged) return;
    setSaving(true);
    setError(null);
    try {
      let blocks;
      if (contentChanged && contentDraft) {
        const parsed = JSON.parse(contentDraft) as SerializedEditorState;
        blocks = editorStateToBlocks(parsed);
      }
      await saveMaterialPage({
        materialId: page.material.id,
        placement: placementChanged
          ? {
              title: title.trim() || page.material.title,
              description,
              url: page.material.kind === "link" ? url.trim() : page.material.url,
              scheduledDate: scheduledDate || null,
              dueDate: dueDate || null,
            }
          : undefined,
        blocks,
      });
      if (contentDraft) setContentBaseline(contentDraft);
      await page.invalidate();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function afterRestore() {
    setBaselineReady(false);
    setContentBaseline(null);
    setContentDraft(null);
    setEditorEpoch((value) => value + 1);
  }

  return {
    page,
    formId: MATERIAL_EDIT_FORM_ID,
    title,
    description,
    url,
    scheduledDate,
    dueDate,
    setTitle,
    setDescription,
    setUrl,
    setScheduledDate,
    setDueDate,
    saving,
    error,
    hasChanges: placementChanged || contentChanged,
    editorEpoch,
    onDraftChange,
    save,
    afterRestore,
  };
}
