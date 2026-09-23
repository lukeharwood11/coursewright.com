import { useEffect, useState } from "react";
import type { SerializedEditorState } from "lexical";
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
  DEFAULT_SUBMISSION_LIMIT,
  submissionLimitValid,
} from "@/submissions/model/submission";
import { useMaterial } from "./useMaterial";

const MATERIAL_EDIT_FORM_ID = "material-edit-form";

export function useMaterialEdit() {
  const page = useMaterial();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
  const [dueTimezone, setDueTimezone] = useState(browserTimeZone);
  const [acceptSubmissions, setAcceptSubmissions] = useState(false);
  const [allowPastDue, setAllowPastDue] = useState(true);
  const [submissionLimit, setSubmissionLimit] = useState(DEFAULT_SUBMISSION_LIMIT);
  const [fileTypes, setFileTypes] = useState<SubmissionFileType[]>([]);
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
    if (page.material.dueAt && page.material.dueTimezone) {
      setDueTime(wallTimeInZone(page.material.dueAt, page.material.dueTimezone));
      setDueTimezone(page.material.dueTimezone);
    } else {
      setDueTime(DEFAULT_DUE_TIME);
      setDueTimezone(page.material.dueTimezone ?? browserTimeZone());
    }
    setAcceptSubmissions(page.material.acceptSubmissions);
    setAllowPastDue(page.material.allowSubmissionsPastDue);
    setSubmissionLimit(page.material.submissionLimit);
    setFileTypes(parseSubmissionFileTypes(page.material.submissionFileTypes));
  }, [page.material]);

  const baselineTime =
    page.material?.dueAt && page.material.dueTimezone
      ? wallTimeInZone(page.material.dueAt, page.material.dueTimezone)
      : DEFAULT_DUE_TIME;
  const baselineZone = page.material?.dueTimezone ?? browserTimeZone();
  const baselineTypes = parseSubmissionFileTypes(page.material?.submissionFileTypes ?? []).join(",");

  const submissionsInvalid = acceptSubmissions && fileTypes.length === 0;
  const limitInvalid = !submissionLimitValid(submissionLimit);

  const placementChanged = Boolean(
    page.material &&
      (title !== page.material.title ||
        description !== page.material.description ||
        (page.material.kind === "link" && url !== (page.material.url ?? "")) ||
        scheduledDate !== (page.material.scheduledDate ?? "") ||
        dueDate !== (page.material.dueDate ?? "") ||
        (dueDate !== "" && dueTime !== baselineTime) ||
        (dueDate !== "" && dueTimezone !== baselineZone) ||
        acceptSubmissions !== page.material.acceptSubmissions ||
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

  async function save() {
    if (!page.material) return;
    if (!placementChanged && !contentChanged) return;
    if (submissionsInvalid || limitInvalid) {
      setError(
        submissionsInvalid
          ? "Choose at least one kind of file families can turn in."
          : "Submissions allowed must be from 1 to 10.",
      );
      return;
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
              title: title.trim() || page.material.title,
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
              submissionLimit,
              submissionFileTypes: fileTypes,
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
    dueTime,
    dueTimezone,
    acceptSubmissions,
    allowPastDue,
    submissionLimit,
    fileTypes,
    setTitle,
    setDescription,
    setUrl,
    setScheduledDate,
    setDueDate,
    setDueTime,
    setAcceptSubmissions,
    setAllowPastDue,
    setSubmissionLimit,
    toggleFileType(kind: SubmissionFileType) {
      setFileTypes((current) =>
        parseSubmissionFileTypes(
          current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind],
        ),
      );
    },
    saving,
    error,
    hasChanges: placementChanged || contentChanged,
    canSave: !submissionsInvalid && !limitInvalid,
    editorEpoch,
    onDraftChange,
    save,
    afterRestore,
  };
}
