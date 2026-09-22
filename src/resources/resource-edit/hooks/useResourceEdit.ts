import { useEffect, useState } from "react";
import type { SerializedEditorState } from "lexical";
import { saveResourceDocument } from "@/resources/databridge/blocks";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import { useResource } from "@/resources/resource/hooks/useResource";
import { validateResourceLinkUrl, validateResourceTitle } from "@/resources/model/validate";

const FORM_ID = "resource-edit-form";

export function useResourceEdit() {
  const page = useResource();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentBaseline, setContentBaseline] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<string | null>(null);
  const [baselineReady, setBaselineReady] = useState(false);

  useEffect(() => {
    setBaselineReady(false);
    setContentBaseline(null);
    setContentDraft(null);
  }, [page.item?.id]);

  useEffect(() => {
    if (!page.item) return;
    setTitle(page.item.title);
    setDescription(page.item.description);
    setUrl(page.item.url ?? "");
  }, [page.item]);

  const placementChanged = Boolean(
    page.item &&
      (title !== page.item.title ||
        description !== page.item.description ||
        (page.item.type === "link" && url !== (page.item.url ?? ""))),
  );
  const contentChanged =
    page.item?.type === "document" &&
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
    if (!page.item) return;
    const titleError = validateResourceTitle(title);
    if (titleError) {
      setError(titleError);
      return;
    }
    if (page.item.type === "link") {
      const urlError = validateResourceLinkUrl(url);
      if (urlError) {
        setError(urlError);
        return;
      }
    }
    if (!placementChanged && !contentChanged) return;
    setSaving(true);
    setError(null);
    try {
      let blocks;
      if (contentChanged && contentDraft) {
        const parsed = JSON.parse(contentDraft) as SerializedEditorState;
        blocks = editorStateToBlocks(parsed);
      }
      await saveResourceDocument({
        itemId: page.item.id,
        title: title.trim(),
        description,
        url: page.item.type === "link" ? url.trim() : undefined,
        blocks,
      });
      if (contentDraft) {
        setContentBaseline(contentDraft);
      }
      page.invalidate();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Couldn’t save.");
    } finally {
      setSaving(false);
    }
  }

  return {
    page,
    formId: FORM_ID,
    title,
    setTitle,
    description,
    setDescription,
    url,
    setUrl,
    saving,
    error,
    hasChanges: placementChanged || contentChanged,
    onDraftChange,
    save,
  };
}
