import type { FormEvent } from "react";
import { Input } from "@/ui/Input";
import { ORG_TYPES, orgTypeLabel } from "@/organizations/model/orgType";
import { GRADE_SCHEMES } from "@/organizations/model/gradeScheme";

export const ORG_SETTINGS_FORM_ID = "org-settings-form";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

export function OrgSettingsForm({
  canEdit,
  name,
  slug,
  orgType,
  gradeScheme,
  gradeLabelsText,
  confirmPermalinkChange,
  slugChanged,
  error,
  onNameChange,
  onSlugChange,
  onOrgTypeChange,
  onGradeSchemeChange,
  onGradeLabelsTextChange,
  onConfirmPermalinkChange,
  onSubmit,
}: {
  canEdit: boolean;
  name: string;
  slug: string;
  orgType: string;
  gradeScheme: string;
  gradeLabelsText: string;
  confirmPermalinkChange: boolean;
  slugChanged: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onOrgTypeChange: (value: string) => void;
  onGradeSchemeChange: (value: string) => void;
  onGradeLabelsTextChange: (value: string) => void;
  onConfirmPermalinkChange: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      id={ORG_SETTINGS_FORM_ID}
      onSubmit={onSubmit}
      className="grid items-start gap-4 lg:grid-cols-2"
    >
      <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Organization</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Name</span>
            <Input
              className="w-full"
              required
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              disabled={!canEdit}
              autoComplete="organization"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Permalink</span>
            <Input
              className="w-full"
              value={slug}
              onChange={(event) => onSlugChange(event.target.value)}
              disabled={!canEdit}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="text-[12px] text-[var(--ink-faint)]">
              Used in your link: coursewright.com/my/{slug || "…"}
            </span>
          </label>
        </div>

        {slugChanged ? (
          <div className="mt-3 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] p-3">
            <p className="text-[13.5px] leading-relaxed text-[var(--amber-deep)]">
              Changing the permalink breaks existing links. Course Wright will
              not redirect the old URL.
            </p>
            <label className="mt-2 flex items-start gap-2 text-[13.5px] text-[var(--ink)]">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmPermalinkChange}
                onChange={(event) => onConfirmPermalinkChange(event.target.checked)}
                disabled={!canEdit}
              />
              I understand existing links will stop working
            </label>
          </div>
        ) : null}

        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Organization type</span>
          <select
            className={controlClass}
            value={orgType}
            onChange={(event) => onOrgTypeChange(event.target.value)}
            disabled={!canEdit}
          >
            {ORG_TYPES.map((type) => (
              <option key={type} value={type}>
                {orgTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Grade scheme</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          How student and course grade levels work in this organization.
        </p>

        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Preset</span>
          <select
            className={controlClass}
            value={gradeScheme}
            onChange={(event) => onGradeSchemeChange(event.target.value)}
            disabled={!canEdit}
          >
            {GRADE_SCHEMES.map((scheme) => (
              <option key={scheme} value={scheme}>
                {scheme === "k12" ? "K–12" : "Custom"}
              </option>
            ))}
          </select>
        </label>

        {gradeScheme === "k12" ? (
          <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            K–12 includes K, 1–12, and common bands (K–2, 3–5, 6–8, 9–12).
          </p>
        ) : (
          <label className="mt-3 flex flex-col gap-1">
            <span className="text-[13px] font-bold text-[var(--ink-soft)]">Grade labels</span>
            <textarea
              className={`${controlClass} min-h-[7rem] resize-y`}
              value={gradeLabelsText}
              onChange={(event) => onGradeLabelsTextChange(event.target.value)}
              disabled={!canEdit}
              spellCheck={false}
            />
            <span className="text-[12px] text-[var(--ink-faint)]">
              One label per line. Use exact grades, ranges, or your own bands.
            </span>
          </label>
        )}
      </section>

      {error ? (
        <p className="text-[13px] text-[var(--amber-deep)] lg:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
