import { useRef } from "react";
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Input } from "@/ui/Input";
import { SavingOverlay } from "@/ui/SavingOverlay";
import { useToastOnError } from "@/ui/useToastOnError";
import { DEFAULT_CHROME } from "@/organizations/model/brand";
import { useOrgBranding } from "../hooks/useOrgBranding";
import { BrandingPreview, BrandingReportCardPreview } from "./BrandingPreview";
import { OrgSettingsSectionTitle } from "./OrgSettingsSectionTitle";

export function BrandingSection({
  organizationId,
  orgName,
  canManage,
}: {
  organizationId: number;
  orgName: string;
  canManage: boolean;
}) {
  const branding = useOrgBranding(organizationId);
  useToastOnError(branding.loadError);
  useToastOnError(branding.formError);
  const colorValue = branding.preview.accent || DEFAULT_CHROME.accent;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const iconStatus = branding.iconFileName
    ? branding.iconFileName
    : branding.iconUrl
      ? "Current icon"
      : "No icon selected";

  const logoStatus = branding.logoFileName
    ? branding.logoFileName
    : branding.logoUrl
      ? "Current logo"
      : "No logo selected";

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <OrgSettingsSectionTitle tab="branding" />
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        {canManage
          ? "A small icon and color for the sidebar, plus an optional full logo for report cards."
          : "Only owners can change branding."}
      </p>

      {branding.loading ? (
        <p className="mt-4 text-[14px] text-[var(--ink-soft)]">Loading branding…</p>
      ) : branding.loadError ? (
        <p className="mt-4 text-[14px] text-[var(--ink)]" role="alert">
          Branding isn’t available right now.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[12.5px] font-bold text-[var(--ink-faint)]">Sidebar</p>
              <BrandingPreview
                orgName={orgName}
                iconUrl={branding.iconUrl}
                chrome={branding.preview}
              />
            </div>
            <div>
              <p className="mb-2 text-[12.5px] font-bold text-[var(--ink-faint)]">Logo preview</p>
              <BrandingReportCardPreview
                orgName={orgName}
                logoUrl={branding.logoUrl}
                logoAccentBackground={branding.logoAccentBackground}
                accentColor={branding.draftAccentColor}
              />
            </div>
          </div>

          {canManage ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">Icon</span>
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  Square mark for the sidebar and org list.
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    branding.onIconChange(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" aria-hidden />
                    {branding.iconUrl || branding.iconFileName
                      ? "Replace icon"
                      : "Choose icon"}
                  </Button>
                  {branding.iconUrl ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={branding.onRemoveIcon}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                      Remove icon
                    </Button>
                  ) : null}
                </div>
                <span className="text-[13.5px] text-[var(--ink)]">{iconStatus}</span>
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  Square PNG, JPEG, or WebP, under 256 KB.
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">
                  Logo with text
                </span>
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  Wide lockup for report cards and print. Leave empty to show the org name only.
                </span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    branding.onLogoChange(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" aria-hidden />
                    {branding.logoUrl || branding.logoFileName ? "Replace logo" : "Choose logo"}
                  </Button>
                  {branding.logoUrl ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={branding.onRemoveLogo}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                      Remove logo
                    </Button>
                  ) : null}
                </div>
                <span className="text-[13.5px] text-[var(--ink)]">{logoStatus}</span>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--ink)]">
                      Accent color background
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[var(--ink-faint)]">
                      For logos with white or light text. Uses your accent color, or Wright Green
                      when blank.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={branding.logoAccentBackground}
                    aria-label={`Accent color background: ${branding.logoAccentBackground ? "On" : "Off"}`}
                    disabled={!branding.logoUrl}
                    onClick={branding.onToggleLogoAccentBackground}
                    className={[
                      "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors",
                      "focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--green-tint)]",
                      "disabled:cursor-not-allowed disabled:opacity-45",
                      branding.logoAccentBackground
                        ? "border-[var(--green)] bg-[var(--green)]"
                        : "border-[var(--line)] bg-[var(--paper)]",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--surface)] shadow-sm transition-transform",
                        branding.logoAccentBackground ? "left-[1.35rem]" : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  PNG, JPEG, or WebP, under 256 KB.
                </span>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">Accent color</span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick an accent color"
                    value={colorValue}
                    className="h-11 w-11 shrink-0 cursor-pointer rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-1"
                    onChange={(event) => branding.onAccentChange(event.target.value)}
                  />
                  <Input
                    value={branding.accentText}
                    onChange={(event) => branding.onAccentChange(event.target.value)}
                    placeholder="#33604D"
                    spellCheck={false}
                    className="w-full font-mono"
                  />
                </span>
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  Leave blank to keep Wright Green. The color has to be dark enough for white text.
                </span>
              </label>

              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                <Button
                  onClick={branding.onSave}
                  disabled={!branding.hasChanges || branding.saving || branding.removing}
                >
                  <CheckIcon className="h-4 w-4" aria-hidden />
                  Save
                </Button>
                {branding.canRemove ? (
                  <Button
                    variant="secondary"
                    onClick={branding.onAskRemove}
                    disabled={branding.saving || branding.removing}
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden />
                    Remove branding
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={branding.onReset}
                  disabled={!branding.isDirty || branding.saving || branding.removing}
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden />
                  Reset
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {branding.saving || branding.removing ? <SavingOverlay /> : null}

      <ConfirmDialog
        open={branding.confirmRemove}
        title="Remove branding?"
        body="The sidebar goes back to the Course Wright mark and green."
        confirmLabel="Remove branding"
        cancelLabel="Keep branding"
        onConfirm={branding.onConfirmRemove}
        onCancel={branding.onCancelRemove}
      />
    </section>
  );
}
