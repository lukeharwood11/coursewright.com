import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
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
    <form onSubmit={onSubmit} className="mt-6 flex w-full min-w-0 max-w-lg flex-col gap-5">
      <div className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-semibold text-[var(--ink)]">
            How can we make Course Wright better?
          </span>
          <textarea
            className={`${controlClass} min-h-[12rem] resize-y`}
            required
            maxLength={FEEDBACK_MESSAGE_MAX}
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Share what’s working, what’s confusing, or what you’d love to see next."
            autoFocus
          />
        </label>

        {formError ? (
          <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="mt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send feedback"}
          </Button>
        </div>
      </div>

      <FeedbackIdentitySummary
        name={name}
        email={email}
        orgValue={orgValue}
        roleLabel={roleLabel}
      />
    </form>
  );
}

function FeedbackIdentitySummary({
  name,
  email,
  orgValue,
  roleLabel,
}: {
  name: string;
  email: string;
  orgValue: string;
  roleLabel: string | null;
}) {
  const rows: { term: string; detail: string }[] = [
    { term: "Name", detail: name },
    { term: "Email", detail: email },
    { term: "Organization", detail: orgValue },
  ];
  if (roleLabel) {
    rows.push({ term: "Role", detail: roleLabel });
  }

  return (
    <section
      className="min-w-0 rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] px-4 py-3"
      aria-label="Included with your message"
    >
      <p className="text-[12px] font-bold text-[var(--ink-faint)]">
        Included with your message
      </p>
      <dl className="mt-2 flex flex-col gap-1.5">
        {rows.map(({ term, detail }) => (
          <div
            key={term}
            className="flex flex-col gap-0.5 text-[13px] leading-snug sm:flex-row sm:gap-3"
          >
            <dt className="shrink-0 text-[var(--ink-faint)] sm:w-[6.5rem]">{term}</dt>
            <dd className="min-w-0 break-all text-[var(--ink-soft)]">
              {detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
