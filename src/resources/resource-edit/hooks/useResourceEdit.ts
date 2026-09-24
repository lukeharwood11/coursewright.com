import { useEffect, useRef, useState } from "react";
import type { SerializedEditorState } from "lexical";
import { saveResourceDocument } from "@/resources/databridge/blocks";
import { updateResourceItem } from "@/resources/databridge/items";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import { useResource } from "@/resources/resource/hooks/useResource";
import { validateResourceLinkUrl, validateResourceTitle } from "@/resources/model/validate";
import { isNetworkError } from "@/ui/networkError";

const FORM_ID = "resource-edit-form";

export function useResourceEdit() {
  const page = useResource();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentBaseline, setContentBaseline] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<string | null>(null);
  const [baselineReady, setBaselineReady] = useState(false);
  const titleCommitRef = useRef<Promise<boolean> | null>(null);
  const titleRef = useRef(title);
  const savedTitleRef = useRef(savedTitle);
  titleRef.current = title;
  savedTitleRef.current = savedTitle;

  useEffect(() => {
    setBaselineReady(false);
    setContentBaseline(null);
    setContentDraft(null);
  }, [page.item?.id]);

  useEffect(() => {
    if (!page.item) return;
    setTitle(page.item.title);
    setSavedTitle(page.item.title);
    setDescription(page.item.description);
    setUrl(page.item.url ?? "");
  }, [page.item?.id]);

  const placementChanged = Boolean(
    page.item &&
      (description !== page.item.description ||
        (page.item.type === "link" && url !== (page.item.url ?? ""))),
  );
  // Name is saved on blur / Enter / leave, so it must not enable Save.
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

  /**
   * Saves the name on blur, Enter, or leave. Coalesces overlapping calls.
   * Invalid names revert to the last saved title.
   */
  async function commitTitle(): Promise<boolean> {
    if (titleCommitRef.current) return titleCommitRef.current;
    const run = (async () => {
      if (!page.item || saving) return true;
      const next = titleRef.current.trim();
      const previous = savedTitleRef.current;
      if (next === previous) {
        setTitle(previous);
        return true;
      }
      const titleError = validateResourceTitle(next);
      if (titleError) {
        setError(titleError);
        setTitle(previous);
        return false;
      }
      setSavingTitle(true);
      setError(null);
      try {
        const updated = await updateResourceItem(page.item.id, { title: next });
        setTitle(updated.title);
        setSavedTitle(updated.title);
        page.invalidate();
        return true;
      } catch (caught: unknown) {
        setError(
          isNetworkError(caught)
            ? "Failed to fetch"
            : caught instanceof Error
              ? caught.message
              : "Couldn’t save.",
        );
        return false;
      } finally {
        setSavingTitle(false);
      }
    })();
    titleCommitRef.current = run.finally(() => {
      titleCommitRef.current = null;
    });
    return titleCommitRef.current;
  }

  /** Returns true when save succeeded or there was nothing to save. */
  async function save(): Promise<boolean> {
    if (!page.item) return false;
    const titleOk = await commitTitle();
    if (!titleOk) return false;
    if (page.item.type === "link") {
      const urlError = validateResourceLinkUrl(url);
      if (urlError) {
        setError(urlError);
        return false;
      }
    }
    if (!placementChanged && !contentChanged) return true;
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
        title: savedTitleRef.current || titleRef.current.trim(),
        description,
        url: page.item.type === "link" ? url.trim() : undefined,
        blocks,
      });
      if (contentDraft) {
        setContentBaseline(contentDraft);
      }
      page.invalidate();
      return true;
    } catch (caught: unknown) {
      setError(
        isNetworkError(caught)
          ? "Failed to fetch"
          : caught instanceof Error
            ? caught.message
            : "Couldn’t save.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    page,
    formId: FORM_ID,
    title,
    setTitle,
    commitTitle,
    description,
    setDescription,
    url,
    setUrl,
    saving: saving || savingTitle,
    error,
    hasChanges: placementChanged || contentChanged,
    onDraftChange,
    save,
  };
}
