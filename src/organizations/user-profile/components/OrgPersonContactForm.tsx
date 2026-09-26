import type { FormEvent } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export function OrgPersonContactForm({
  formId,
  name,
  email,
  canEditEmail,
  linkedEmailChangeWarning,
  error,
  saving,
  hasChanges,
  onNameChange,
  onEmailChange,
  onSubmit,
}: {
  formId: string;
  name: string;
  email: string;
  canEditEmail: boolean;
  linkedEmailChangeWarning: boolean;
  error: string | null;
  saving: boolean;
  hasChanges: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="mt-6 max-w-lg rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
    >
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Profile</h2>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
        <Input
          className="w-full"
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoComplete="off"
        />
      </label>

      {canEditEmail ? (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Contact email
          </span>
          <Input
            className="w-full"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="off"
          />
          {linkedEmailChangeWarning ? (
            <p
              className="rounded-[6px] border border-[var(--amber-deep)]/25 bg-[var(--amber-tint)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--ink-soft)]"
              role="status"
            >
              This person already has a linked account. Their login stays linked to
              this profile even if you change contact email here. That field is for
              organizers only and does not change how they sign in.
            </p>
          ) : null}
        </label>
      ) : email ? (
        <p className="mt-3 text-[13.5px] text-[var(--ink-soft)]">{email}</p>
      ) : null}

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={saving || !hasChanges}>
          <CheckIcon className="h-5 w-5" aria-hidden />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
