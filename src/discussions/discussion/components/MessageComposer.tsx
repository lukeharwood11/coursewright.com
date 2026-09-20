import { useId, useRef, useState } from "react";
import type { SerializedEditorState } from "lexical";
import {
  BookOpenIcon,
  LinkIcon,
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
  "inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]",
  "transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] hover:text-[var(--green-deep)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
  "aria-pressed:border-[var(--green)] aria-pressed:bg-[var(--green-tint)] aria-pressed:text-[var(--green-deep)]",
].join(" ");

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
  useToastOnError(error);

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
        chrome={mode === "lexical" ? "full" : "simple"}
        editable
        embedded
        placeholder={placeholder}
        onChange={(state) => {
          onLexical(state);
          onBody(plainTextFromLexical(state));
        }}
        onSubmit={trySubmit}
      />

      {showAttachmentControls && attachments.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
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
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          ) : null}
          {showSubmit ? (
            <Button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={onSubmit}
            >
              {submitting ? (busyLabel ?? "Working…") : submitLabel}
            </Button>
          ) : null}
        </div>
      </div>

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
