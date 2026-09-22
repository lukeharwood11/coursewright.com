import { Button } from "@/ui/Button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Input } from "@/ui/Input";
import { DEFAULT_CHROME } from "@/organizations/model/brand";
import { useOrgBranding } from "../hooks/useOrgBranding";
import { BrandingPreview } from "./BrandingPreview";

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
  const colorValue = branding.preview.accent || DEFAULT_CHROME.accent;

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Branding</h2>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        {canManage
          ? "A small icon and one color for the sidebar and header. Page buttons stay Course Wright green."
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
          <div>
            <p className="mb-2 text-[12.5px] font-bold text-[var(--ink-faint)]">Preview</p>
            <BrandingPreview
              orgName={orgName}
              iconUrl={branding.iconUrl}
              chrome={branding.preview}
            />
          </div>

          {canManage ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-bold text-[var(--ink-soft)]">Icon</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-[14px] text-[var(--ink)] file:mr-3 file:rounded-[6px] file:border file:border-[var(--line)] file:bg-[var(--surface)] file:px-3 file:py-2 file:text-[13px] file:font-bold file:text-[var(--ink)]"
                  onChange={(event) => {
                    branding.onIconChange(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
                <span className="text-[12.5px] text-[var(--ink-faint)]">
                  Square PNG, JPEG, or WebP, under 256 KB.
                </span>
              </label>
              {branding.iconUrl ? (
                <Button variant="secondary" onClick={branding.onRemoveIcon}>
                  Remove icon
                </Button>
              ) : null}

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
                  Leave blank to keep Wright Green. Light colors aren’t accepted.
                </span>
              </label>

              {branding.formError ? (
                <p className="text-[14px] text-[var(--ink)]" role="alert">
                  {branding.formError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={branding.onSave}
                  disabled={!branding.hasChanges || branding.saving || branding.removing}
                >
                  {branding.saving ? "Saving…" : "Save branding"}
                </Button>
                {branding.canRemove ? (
                  <Button
                    variant="secondary"
                    onClick={branding.onAskRemove}
                    disabled={branding.saving || branding.removing}
                  >
                    Remove branding
                  </Button>
                ) : null}
              </div>
            </div>
          ) : branding.formError ? (
            <p className="text-[14px] text-[var(--ink)]" role="alert">
              {branding.formError}
            </p>
          ) : null}
        </div>
      )}

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
