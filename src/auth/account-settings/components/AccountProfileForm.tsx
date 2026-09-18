import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { ACCOUNT_PROFILE_FORM_ID } from "../hooks/useAccountSettings";

export function AccountProfileForm({
  name,
  email,
  error,
  saving,
  hasChanges,
  onNameChange,
  onSubmit,
}: {
  name: string;
  email: string;
  error: string | null;
  saving: boolean;
  hasChanges: boolean;
  onNameChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      id={ACCOUNT_PROFILE_FORM_ID}
      onSubmit={onSubmit}
      className="mt-6 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
    >
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Profile</h2>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
        <Input
          className="w-full"
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoComplete="name"
          placeholder="Your name"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Email</span>
        <Input
          className="w-full bg-[var(--paper)]"
          value={email}
          readOnly
          autoComplete="email"
        />
        <span className="text-[12px] text-[var(--ink-faint)]">
          Email is managed with your sign-in.
        </span>
      </label>

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={saving || !hasChanges}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
