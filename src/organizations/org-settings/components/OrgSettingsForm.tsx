import type { FormEvent } from "react";
import { Button } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";
import { Input } from "@/ui/Input";
import { Select } from "@/ui/Select";
import { InfoHint } from "@/ui/InfoHint";
import {
  ORG_TYPES,
  orgTypeAboutPlaceholder,
  orgTypeHint,
  orgTypeLabel,
  parseOrgType,
  parseOrgTypeOrDefault,
} from "@/organizations/model/orgType";
import { GRADE_SCHEMES } from "@/organizations/model/gradeScheme";
import {
  WEEKDAYS,
  WEEKDAY_LETTERS,
  WEEKDAY_NAMES,
  type SchoolDay,
} from "@/organizations/model/schoolDays";
import type { OrgSettingsTabId } from "./OrgSettingsNav";

const controlClass = [
  "w-full rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-[13px] py-[11px] text-[14.5px] text-[var(--ink)] outline-none",
  "focus:border-[var(--green)] focus:shadow-[0_0_0_3px_var(--green-tint)]",
  "disabled:bg-[var(--paper)] disabled:text-[var(--ink-soft)]",
].join(" ");

type OrgSettingsFormProps = {
  section: Extract<OrgSettingsTabId, "organization" | "profile">;
  canEdit: boolean;
  name: string;
  slug: string;
  orgType: string;
  gradeScheme: string;
  gradeLabelsText: string;
  schoolDays: SchoolDay[];
  about: string;
  address: string;
  website: string;
  contactEmail: string;
  phone: string;
  confirmPermalinkChange: boolean;
  slugChanged: boolean;
  hasChanges: boolean;
  saving: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onOrgTypeChange: (value: string) => void;
  onGradeSchemeChange: (value: string) => void;
  onGradeLabelsTextChange: (value: string) => void;
  onToggleSchoolDay: (day: SchoolDay) => void;
  onAboutChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onConfirmPermalinkChange: (value: boolean) => void;
  onSubmit: (
    event: FormEvent,
    section: Extract<OrgSettingsTabId, "organization" | "profile">,
  ) => void;
};

export function OrgSettingsForm(props: OrgSettingsFormProps) {
  useToastOnError(props.error);

  return (
    <form
      onSubmit={(event) => {
        props.onSubmit(event, props.section);
      }}
    >
      {props.section === "organization" ? (
        <OrganizationSection {...props} />
      ) : (
        <ProfileSection {...props} />
      )}
    </form>
  );
}

function SectionSave({
  canEdit,
  hasChanges,
  saving,
  label,
}: {
  canEdit: boolean;
  hasChanges: boolean;
  saving: boolean;
  label: string;
}) {
  if (!canEdit) return null;
  return (
    <div className="mt-5">
      <Button type="submit" disabled={!hasChanges || saving}>
        {saving ? "Saving…" : label}
      </Button>
    </div>
  );
}

function OrganizationSection({
  canEdit,
  name,
  slug,
  orgType,
  gradeScheme,
  gradeLabelsText,
  schoolDays,
  confirmPermalinkChange,
  slugChanged,
  hasChanges,
  saving,
  onNameChange,
  onSlugChange,
  onOrgTypeChange,
  onGradeSchemeChange,
  onGradeLabelsTextChange,
  onToggleSchoolDay,
  onConfirmPermalinkChange,
}: OrgSettingsFormProps) {
  const parsedOrgType = parseOrgType(orgType);
  const orgTypeHintText = parsedOrgType ? orgTypeHint(parsedOrgType) : null;
  const selectedDays = new Set(schoolDays);

  return (
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
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Organization type
          </span>
          <Select
            wrapperClassName="w-full"
            value={orgType}
            onChange={(event) => onOrgTypeChange(event.target.value)}
            disabled={!canEdit}
          >
            {ORG_TYPES.map((type) => (
              <option key={type} value={type}>
                {orgTypeLabel(type)}
              </option>
            ))}
          </Select>
          {orgTypeHintText ? (
            <span className="text-[12px] text-[var(--ink-faint)]">{orgTypeHintText}</span>
          ) : null}
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Web address</span>
        <Input
          className="w-full"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          disabled={!canEdit}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="text-[12px] text-[var(--ink-faint)]">
          This is the link to your organization: coursewright.com/my/{slug || "…"}
        </span>
      </label>

      {slugChanged ? (
        <div className="mt-3 rounded-[10px] border border-[var(--amber)] bg-[var(--amber-tint)] p-3">
          <p className="text-[13.5px] leading-relaxed text-[var(--amber-deep)]">
            Changing this address breaks existing links. Course Wright will
            not send people from the old address to the new one.
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

      <div className="mt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">School days</span>
          <InfoHint label="About school days">
            Days this organization usually operates.
          </InfoHint>
        </div>
        <div
          className="mt-2 grid grid-cols-7 gap-1 sm:gap-2"
          role="group"
          aria-label="School days"
        >
          {WEEKDAYS.map((day) => {
            const selected = selectedDays.has(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                aria-label={WEEKDAY_NAMES[day]}
                disabled={!canEdit}
                onClick={() => onToggleSchoolDay(day)}
                className={[
                  "flex aspect-square w-full max-h-10 items-center justify-center rounded-full border text-[clamp(11px,3.2vw,13px)] font-bold",
                  selected
                    ? "border-[var(--green)] bg-[var(--green)] text-[var(--surface)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]",
                  "focus:outline-none focus:shadow-[0_0_0_3px_var(--green-tint)]",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                ].join(" ")}
              >
                {WEEKDAY_LETTERS[day]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Grades</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          How you name grades for students and courses.
        </p>

        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Grade list</span>
          <Select
            wrapperClassName="w-full"
            value={gradeScheme}
            onChange={(event) => onGradeSchemeChange(event.target.value)}
            disabled={!canEdit}
          >
            {GRADE_SCHEMES.map((scheme) => (
              <option key={scheme} value={scheme}>
                {scheme === "k12" ? "K–12" : "Custom"}
              </option>
            ))}
          </Select>
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
      </div>

      <SectionSave
        canEdit={canEdit}
        hasChanges={hasChanges}
        saving={saving}
        label="Save organization"
      />
    </section>
  );
}

function ProfileSection({
  canEdit,
  orgType,
  about,
  address,
  website,
  contactEmail,
  phone,
  hasChanges,
  saving,
  onAboutChange,
  onAddressChange,
  onWebsiteChange,
  onContactEmailChange,
  onPhoneChange,
}: OrgSettingsFormProps) {
  const aboutPlaceholder = orgTypeAboutPlaceholder(parseOrgTypeOrDefault(orgType));

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Profile</h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
        Optional details students see on your organization home.
      </p>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">About</span>
        <textarea
          className={`${controlClass} min-h-[6rem] resize-y`}
          value={about}
          onChange={(event) => onAboutChange(event.target.value)}
          disabled={!canEdit}
          placeholder={aboutPlaceholder}
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">
          Location / address
        </span>
        <Input
          className="w-full"
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          disabled={!canEdit}
          autoComplete="street-address"
          placeholder="Street, city, or where you meet"
        />
      </label>

      <label className="mt-3 flex flex-col gap-1">
        <span className="text-[13px] font-bold text-[var(--ink-soft)]">Website</span>
        <Input
          className="w-full"
          type="text"
          value={website}
          onChange={(event) => onWebsiteChange(event.target.value)}
          disabled={!canEdit}
          autoComplete="url"
          placeholder="https://"
        />
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">
            Contact email
          </span>
          <Input
            className="w-full"
            type="email"
            value={contactEmail}
            onChange={(event) => onContactEmailChange(event.target.value)}
            disabled={!canEdit}
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-[var(--ink-soft)]">Phone</span>
          <Input
            className="w-full"
            type="tel"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            disabled={!canEdit}
            autoComplete="tel"
          />
        </label>
      </div>

      <SectionSave
        canEdit={canEdit}
        hasChanges={hasChanges}
        saving={saving}
        label="Save profile"
      />
    </section>
  );
}
