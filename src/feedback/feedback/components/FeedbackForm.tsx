import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { FEEDBACK_MESSAGE_MAX } from "@/feedback/model/validate";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
].join(" ");

type FeedbackFormProps = {
  name: string;
  email: string;
  orgName: string | null;
  orgSlug: string | null;
  roleLabel: string | null;
  message: string;
  formError: string | null;
  submitting: boolean;
  onMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function FeedbackForm({
  name,
  email,
  orgName,
  orgSlug,
  roleLabel,
  message,
  formError,
  submitting,
  onMessageChange,
  onSubmit,
}: FeedbackFormProps) {
  const orgValue = orgName
    ? orgSlug
      ? `${orgName} (/my/${orgSlug})`
      : orgName
    : "None selected";

  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
      <ReadOnlyField label="Name" value={name} />
      <ReadOnlyField label="Email" value={email} />
      <ReadOnlyField label="Organization" value={orgValue} />
      {roleLabel ? <ReadOnlyField label="Role" value={roleLabel} /> : null}

      <label className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          How can we make Course Wright better?
        </span>
        <textarea
          className={`${controlClass} min-h-[10rem] resize-y`}
          required
          maxLength={FEEDBACK_MESSAGE_MAX}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
        />
      </label>

      {formError ? (
        <p className="text-[13px] text-[var(--amber-deep)]" role="alert">
          {formError}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[13px] font-bold text-[var(--ink-soft)]">{label}</span>
      <Input className="w-full" value={value} readOnly />
    </label>
  );
}
