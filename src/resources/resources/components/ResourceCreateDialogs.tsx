import { useEffect, useId, useState } from "react";
import { CheckIcon, LinkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { toastCaughtError } from "@/ui/toast";

export function FolderNameDialog({
  open,
  pending,
  onClose,
  onSubmit,
  initialName = "",
  title = "New folder",
  submitLabel = "Create",
  pendingLabel = "Creating…",
}: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<unknown>;
  initialName?: string;
  title?: string;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const titleId = useId();
  const fieldId = useId();
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, initialName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(name)
            .then(() => onClose())
            .catch((caught) => toastCaughtError(caught));
        }}
      >
        <h2 id={titleId} className="text-[15.5px] font-extrabold text-[var(--ink)]">
          {title}
        </h2>
        <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]" htmlFor={fieldId}>
          Name
          <Input
            id={fieldId}
            className="mt-1 w-full"
            value={name}
            autoFocus
            placeholder="Folder name"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !name.trim()}>
            <CheckIcon className="h-4 w-4" aria-hidden />
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function LinkResourceDialog({
  open,
  pending,
  onClose,
  onCreate,
}: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; url: string }) => Promise<unknown>;
}) {
  const titleId = useId();
  const nameId = useId();
  const urlId = useId();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setUrl("");
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/30"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
        onSubmit={(event) => {
          event.preventDefault();
          void onCreate({ title, url })
            .then(() => onClose())
            .catch((caught) => toastCaughtError(caught));
        }}
      >
        <h2 id={titleId} className="text-[15.5px] font-extrabold text-[var(--ink)]">
          New link
        </h2>
        <label className="mt-4 block text-[13px] font-bold text-[var(--ink-soft)]" htmlFor={nameId}>
          Title
          <Input
            id={nameId}
            className="mt-1 w-full"
            value={title}
            autoFocus
            placeholder="Link title"
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="mt-3 block text-[13px] font-bold text-[var(--ink-soft)]" htmlFor={urlId}>
          Web address
          <Input
            id={urlId}
            className="mt-1 w-full"
            value={url}
            placeholder="https://"
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" aria-hidden />
            Cancel
          </Button>
          <Button type="submit" disabled={pending || !title.trim() || !url.trim()}>
            <LinkIcon className="h-4 w-4" aria-hidden />
            {pending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
