import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export function CreateOrganizationForm({
  name,
  slug,
  error,
  submitting,
  emptyState,
  onNameChange,
  onSlugChange,
  onSubmit,
}: {
  name: string;
  slug: string;
  error: string | null;
  submitting: boolean;
  emptyState: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5"
    >
      <h2
        className="text-[15.5px] font-extrabold text-[var(--ink)]"
      >
        {emptyState ? "Create your first organization" : "New organization"}
      </h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        {emptyState
          ? "Start planning and print what you make — no roster needed."
          : "Anyone can create an organization. You’ll be the first owner."}
      </p>

      <label className="mt-4 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
        <Input
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Maple Grove co-op"
          autoComplete="organization"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Permalink</span>
        <Input
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          placeholder="maple-grove"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="text-[12px] text-[var(--ink-faint)]">
          Used in your link: coursewright.com/my/{slug || "…"}
        </span>
      </label>

      {error ? (
        <p className="mt-3 text-[13px] text-[var(--amber-deep)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={submitting} fullWidth>
          {submitting ? "Creating…" : "Create organization"}
        </Button>
      </div>
    </form>
  );
}
