import { useEffect, useId, useRef, useState } from "react";
import type { SerializedEditorState } from "lexical";
import {
  BookOpenIcon,
  LinkIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";
import type { AttachableMaterial } from "@/discussions/databridge/discussions";
import { plainTextFromLexical } from "@/discussions/model/messageBody";
import type { MentionPerson } from "@/discussions/model/mentions";
import { ComposerAttachModal } from "./ComposerAttachModal";
import { DiscussionLexicalEditor } from "./DiscussionLexicalEditor";

export type PendingAttachment =
  | { key: string; kind: "file"; file: File; label: string }
  | { key: string; kind: "material"; materialId: number; label: string }
  | { key: string; kind: "url"; url: string; label: string };

export type ComposerMode = "plain" | "lexical";

const iconBtn = [
  "inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--ink-soft)]",
  "transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "aria-pressed:bg-[var(--green-tint)] aria-pressed:text-[var(--green-deep)]",
].join(" ");

const sendBtn = [
  "inline-flex h-8 w-8 items-center justify-center rounded-[6px]",
  "border border-[var(--green)] bg-[var(--green)] text-white",
  "transition-colors hover:border-[var(--green-deep)] hover:bg-[var(--green-deep)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "disabled:pointer-events-none disabled:opacity-60",
  "motion-reduce:transition-none",
].join(" ");

const compactBtn = "!h-8 !px-2.5 !py-0 text-[12.5px]";

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `att-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MessageComposer({
  mode,
  onMode,
  body,
  onBody,
  lexical,
  onLexical,
  composeKey = 0,
  attachments,
  onAttachments,
  materials,
  canSubmit,
  submitting,
  submitLabel,
  busyLabel,
  placeholder,
  error,
  onSubmit,
  showSubmit = true,
  showAttachmentControls = true,
  variant = "card",
  onCancel,
  cancelLabel = "Cancel",
  mentionPeople = [],
  mentionExcludeUserId,
  mentionsLoading = false,
}: {
  mode: ComposerMode;
  onMode: (mode: ComposerMode) => void;
  body: string;
  onBody: (value: string) => void;
  lexical: SerializedEditorState;
  onLexical: (value: SerializedEditorState) => void;
  /** Bump when seeding Lexical from outside (e.g. Quote). */
  composeKey?: number;
  attachments: PendingAttachment[];
  onAttachments: (next: PendingAttachment[]) => void;
  materials: AttachableMaterial[];
  canSubmit: boolean;
  submitting: boolean;
  submitLabel: string;
  busyLabel?: string;
  placeholder: string;
  error: string | null;
  onSubmit: () => void;
  showSubmit?: boolean;
  showAttachmentControls?: boolean;
  variant?: "card" | "plain";
  onCancel?: () => void;
  cancelLabel?: string;
  mentionPeople?: MentionPerson[];
  mentionExcludeUserId?: string;
  mentionsLoading?: boolean;
}) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  useToastOnError(error);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    function sync() {
      setIsNarrow(mq.matches);
      if (mq.matches && mode === "lexical") onMode("plain");
    }
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [mode, onMode]);

  function addFile(file: File) {
    onAttachments([
      ...attachments,
      { key: newKey(), kind: "file", file, label: file.name },
    ]);
  }

  function enableRichText() {
    onMode("lexical");
  }

  function enablePlainText() {
    onMode("plain");
  }

  function trySubmit(): boolean {
    if (!canSubmit || submitting) return false;
    onSubmit();
    return true;
  }

  const lexicalEmpty = plainTextFromLexical(lexical).trim() === "";
  const seedText = lexicalEmpty && body.trim() ? body : undefined;
  const useSendIcon = submitLabel === "Post";
  const richTextAllowed = !isNarrow;
  const chrome = richTextAllowed && mode === "lexical" ? "full" : "simple";

  const richTextToggle = richTextAllowed ? (
    <button
      type="button"
      className={iconBtn}
      aria-pressed={mode === "lexical"}
      aria-label={
        mode === "lexical" ? "Turn off rich text" : "Turn on rich text"
      }
      title={mode === "lexical" ? "Plain text" : "Rich text"}
      onClick={() => {
        if (mode === "lexical") enablePlainText();
        else enableRichText();
      }}
    >
      <span className="font-serif text-[15px] font-bold leading-none">T</span>
    </button>
  ) : null;

  const endSlot = (
    <>
      {showAttachmentControls ? (
        <>
          <input
            id={fileInputId}
            ref={fileRef}
            type="file"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) addFile(file);
            }}
          />
          {richTextToggle}
          <button
            type="button"
            className={iconBtn}
            aria-label="Add file"
            title="Add file"
            onClick={() => fileRef.current?.click()}
          >
            <PaperClipIcon className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className={iconBtn}
            aria-label="Add material or link"
            title="Add material or link"
            onClick={() => setAttachOpen(true)}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
          </button>
        </>
      ) : (
        richTextToggle
      )}
      {onCancel ? (
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          className={compactBtn}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      ) : null}
      {showSubmit ? (
        useSendIcon ? (
          <button
            type="button"
            className={sendBtn}
            disabled={!canSubmit || submitting}
            aria-label={submitting ? (busyLabel ?? "Posting…") : "Post"}
            title={submitting ? (busyLabel ?? "Posting…") : "Post"}
            onClick={onSubmit}
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <Button
            type="button"
            disabled={!canSubmit || submitting}
            className={compactBtn}
            onClick={onSubmit}
          >
            {submitting ? (busyLabel ?? "Working…") : submitLabel}
          </Button>
        )
      ) : null}
    </>
  );

  return (
    <div
      className={
        variant === "card"
          ? "rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          : undefined
      }
    >
      <DiscussionLexicalEditor
        editorKey={`compose-${composeKey}`}
        initialLexical={seedText ? null : lexical}
        seedPlainText={seedText}
        mentionPeople={mentionPeople}
        mentionExcludeUserId={mentionExcludeUserId}
        mentionsLoading={mentionsLoading}
        chrome={chrome}
        editable
        embedded
        placeholder={placeholder}
        endSlot={endSlot}
        onChange={(state) => {
          onLexical(state);
          onBody(plainTextFromLexical(state));
        }}
        onSubmit={trySubmit}
      />

      {showAttachmentControls && attachments.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5 px-3 md:mt-3 md:px-0">
          {attachments.map((attachment) => (
            <li
              key={attachment.key}
              className="flex items-center justify-between gap-2 rounded-[6px] border border-[var(--line-soft)] bg-[var(--paper)] px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[var(--ink)]">
                {attachment.kind === "file" ? (
                  <PaperClipIcon
                    className="h-4 w-4 shrink-0 text-[var(--ink-soft)]"
                    aria-hidden
                  />
                ) : attachment.kind === "material" ? (
                  <BookOpenIcon
                    className="h-4 w-4 shrink-0 text-[var(--green)]"
                    aria-hidden
                  />
                ) : (
                  <LinkIcon
                    className="h-4 w-4 shrink-0 text-[var(--green)]"
                    aria-hidden
                  />
                )}
                <span className="truncate">
                  {attachment.kind === "file"
                    ? attachment.label
                    : attachment.kind === "material"
                      ? attachment.label
                      : attachment.label || attachment.url}
                </span>
              </span>
              <button
                type="button"
                className="shrink-0 rounded-[4px] p-1 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]"
                aria-label="Remove attachment"
                onClick={() =>
                  onAttachments(
                    attachments.filter((item) => item.key !== attachment.key),
                  )
                }
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showAttachmentControls ? (
        <ComposerAttachModal
          open={attachOpen}
          materials={materials}
          onClose={() => setAttachOpen(false)}
          onAddMaterial={(material) => {
            onAttachments([
              ...attachments,
              {
                key: newKey(),
                kind: "material",
                materialId: material.id,
                label: material.title,
              },
            ]);
          }}
          onAddLink={({ url, label }) => {
            onAttachments([
              ...attachments,
              { key: newKey(), kind: "url", url, label },
            ]);
          }}
        />
      ) : null}
    </div>
  );
}
