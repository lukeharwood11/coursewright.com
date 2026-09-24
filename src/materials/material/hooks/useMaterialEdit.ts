import { useEffect, useRef, useState } from "react";
import type { SerializedEditorState } from "lexical";
import { updateMaterial } from "@/materials/databridge/materials";
import { saveMaterialPage } from "@/materials/databridge/saveMaterialPage";
import { editorStateToBlocks } from "@/materials/model/pageContent";
import {
  browserTimeZone,
  DEFAULT_DUE_TIME,
  dueInstantIso,
  wallTimeInZone,
} from "@/submissions/model/dueInstant";
import {
  parseSubmissionFileTypes,
  type SubmissionFileType,
} from "@/submissions/model/fileTypes";
import {
  DEFAULT_MATERIAL_POINTS,
  materialPointsAreValid,
  parseMaterialPoints,
} from "@/submissions/model/grade";
import {
  DEFAULT_SUBMISSION_LIMIT,
  submissionLimitValid,
} from "@/submissions/model/submission";
import { isNetworkError } from "@/ui/networkError";
import { useMaterial } from "./useMaterial";

const MATERIAL_EDIT_FORM_ID = "material-edit-form";

type PlacementSeed = {
  title: string;
  description: string;
  url: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
  dueAt: string | null;
  dueTimezone: string | null;
  acceptSubmissions: boolean;
  allowSubmissionsPastDue: boolean;
  gradable: boolean;
  pointsPossible: number | null;
  submissionLimit: number;
  submissionFileTypes: string[];
};

export function useMaterialEdit() {
  const page = useMaterial();
  const [title, setTitle] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
  const [dueTimezone, setDueTimezone] = useState(browserTimeZone);
  const [acceptSubmissions, setAcceptSubmissions] = useState(false);
  const [gradable, setGradable] = useState(false);
  const [pointsText, setPointsText] = useState(String(DEFAULT_MATERIAL_POINTS));
  const [allowPastDue, setAllowPastDue] = useState(true);
  const [submissionLimit, setSubmissionLimit] = useState(DEFAULT_SUBMISSION_LIMIT);
  const [fileTypes, setFileTypes] = useState<SubmissionFileType[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentBaseline, setContentBaseline] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<string | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [baselineReady, setBaselineReady] = useState(false);
  const resyncPlacement = useRef(false);
  const titleCommitRef = useRef<Promise<boolean> | null>(null);
  const titleRef = useRef(title);
  const savedTitleRef = useRef(savedTitle);
  titleRef.current = title;
  savedTitleRef.current = savedTitle;

  function seedPlacement(material: PlacementSeed) {
    setTitle(material.title);
    setSavedTitle(material.title);
    setDescription(material.description);
    setUrl(material.url ?? "");
    setScheduledDate(material.scheduledDate ?? "");
    setDueDate(material.dueDate ?? "");
    if (material.dueAt && material.dueTimezone) {
      setDueTime(wallTimeInZone(material.dueAt, material.dueTimezone));
      setDueTimezone(material.dueTimezone);
    } else {
      setDueTime(DEFAULT_DUE_TIME);
      setDueTimezone(material.dueTimezone ?? browserTimeZone());
    }
    setAcceptSubmissions(material.acceptSubmissions);
    setGradable(material.gradable);
    setPointsText(
      material.pointsPossible != null
        ? String(material.pointsPossible)
        : String(DEFAULT_MATERIAL_POINTS),
    );
    setAllowPastDue(material.allowSubmissionsPastDue);
    setSubmissionLimit(material.submissionLimit);
    setFileTypes(parseSubmissionFileTypes(material.submissionFileTypes));
  }

  useEffect(() => {
    setBaselineReady(false);
    setContentBaseline(null);
    setContentDraft(null);
  }, [page.material?.id]);

  // Seed once per material id (title blur must not wipe other staged fields).
  useEffect(() => {
    if (!page.material) return;
    seedPlacement(page.material);
  }, [page.material?.id]);

  // After version restore, re-seed when the refreshed material arrives.
  useEffect(() => {
    if (!resyncPlacement.current || !page.material) return;
    resyncPlacement.current = false;
    seedPlacement(page.material);
  }, [page.material]);

  const baselineTime =
    page.material?.dueAt && page.material.dueTimezone
      ? wallTimeInZone(page.material.dueAt, page.material.dueTimezone)
      : DEFAULT_DUE_TIME;
  const baselineZone = page.material?.dueTimezone ?? browserTimeZone();
  const baselineTypes = parseSubmissionFileTypes(page.material?.submissionFileTypes ?? []).join(",");

  const submissionsInvalid = acceptSubmissions && fileTypes.length === 0;
  const limitInvalid = !submissionLimitValid(submissionLimit);
  const pointsInvalid = acceptSubmissions && gradable && parseMaterialPoints(pointsText) == null;
  const pointsPossible = gradable ? parseMaterialPoints(pointsText) : null;

  // Title is saved on blur / Enter / leave, so it must not enable Save.
  const placementChanged = Boolean(
    page.material &&
      (description !== page.material.description ||
        (page.material.kind === "link" && url !== (page.material.url ?? "")) ||
        scheduledDate !== (page.material.scheduledDate ?? "") ||
        dueDate !== (page.material.dueDate ?? "") ||
        (dueDate !== "" && dueTime !== baselineTime) ||
        (dueDate !== "" && dueTimezone !== baselineZone) ||
        acceptSubmissions !== page.material.acceptSubmissions ||
        gradable !== page.material.gradable ||
        (gradable && pointsPossible !== page.material.pointsPossible) ||
        allowPastDue !== page.material.allowSubmissionsPastDue ||
        submissionLimit !== page.material.submissionLimit ||
        fileTypes.join(",") !== baselineTypes),
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

  /**
   * Saves the name on blur, Enter, or leave. Coalesces overlapping calls.
   * Empty names revert to the last saved title.
   */
  async function commitTitle(): Promise<boolean> {
    if (titleCommitRef.current) return titleCommitRef.current;
    const run = (async () => {
      if (!page.material || saving) return true;
      const next = titleRef.current.trim();
      const previous = savedTitleRef.current;
      if (!next) {
        setError("Give the material a title.");
        setTitle(previous);
        return false;
      }
      if (next === previous) {
        setTitle(previous);
        return true;
      }
      setSavingTitle(true);
      setError(null);
      try {
        await updateMaterial(page.material.id, { title: next });
        setTitle(next);
        setSavedTitle(next);
        await page.invalidate();
        return true;
      } catch (caught: unknown) {
        setError(isNetworkError(caught) ? "Failed to fetch" : "Couldn’t save the title.");
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
    if (!page.material) return false;
    const titleOk = await commitTitle();
    if (!titleOk) return false;
    if (!placementChanged && !contentChanged) return true;
    if (submissionsInvalid || limitInvalid || pointsInvalid) {
      setError(
        submissionsInvalid
          ? "Choose at least one kind of file families can turn in."
          : pointsInvalid
            ? "Possible points must be greater than 0."
            : "Submissions allowed must be from 1 to 10.",
      );
      return false;
    }
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
              title: savedTitleRef.current,
              description,
              url: page.material.kind === "link" ? url.trim() : page.material.url,
              scheduledDate: scheduledDate || null,
              dueDate: dueDate || null,
              dueAt: dueDate
                ? dueInstantIso(dueDate, dueTime || DEFAULT_DUE_TIME, dueTimezone)
                : null,
              dueTimezone: dueDate ? dueTimezone : null,
              acceptSubmissions,
              allowSubmissionsPastDue: allowPastDue,
              gradable: acceptSubmissions && gradable,
              pointsPossible: acceptSubmissions && gradable ? pointsPossible : null,
              submissionLimit,
              submissionFileTypes: fileTypes,
            }
          : undefined,
        blocks,
      });
      if (contentDraft) setContentBaseline(contentDraft);
      await page.invalidate();
      return true;
    } catch (caught: unknown) {
      setError(isNetworkError(caught) ? "Failed to fetch" : "Something went wrong.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function afterRestore() {
    resyncPlacement.current = true;
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
    dueTime,
    dueTimezone,
    acceptSubmissions,
    gradable,
    pointsText,
    allowPastDue,
    submissionLimit,
    fileTypes,
    setTitle,
    setDescription,
    setUrl,
    setScheduledDate,
    setDueDate,
    setDueTime,
    setAcceptSubmissions(value: boolean) {
      setAcceptSubmissions(value);
      if (!value) setGradable(false);
    },
    setGradable(value: boolean) {
      setGradable(value);
      if (value && !materialPointsAreValid(Number(pointsText))) {
        setPointsText(String(DEFAULT_MATERIAL_POINTS));
      }
    },
    setPointsText,
    setAllowPastDue,
    setSubmissionLimit,
    toggleFileType(kind: SubmissionFileType) {
      setFileTypes((current) =>
        parseSubmissionFileTypes(
          current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
        ),
      );
    },
    saving: saving || savingTitle,
    error,
    hasChanges: placementChanged || contentChanged,
    canSave: !submissionsInvalid && !limitInvalid && !pointsInvalid,
    editorEpoch,
    onDraftChange,
    commitTitle,
    save,
    afterRestore,
  };
}
