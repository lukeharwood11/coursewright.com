import { Button } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";
import { ORG_FEATURE_OPTIONS } from "@/organizations/model/features";
import { useOrgFeatures } from "../hooks/useOrgFeatures";

export function CustomizationsSection({
  organizationId,
  canManage,
}: {
  organizationId: number;
  canManage: boolean;
}) {
  const customizations = useOrgFeatures(organizationId);
  useToastOnError(customizations.loadError);

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Customizations</h2>
      <p className="mt-1 text-[14px] text-[var(--ink-soft)]">
        {canManage
          ? "Choose which features people in this organization can use."
          : "Only owners can change customizations."}
      </p>

      {customizations.loading ? (
        <p className="mt-4 text-[14px] text-[var(--ink-soft)]">Loading customizations…</p>
      ) : customizations.loadError ? (
        <p className="mt-4 text-[14px] text-[var(--ink)]" role="alert">
          Customizations aren’t available right now.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <ul className="divide-y divide-[var(--line-soft)] rounded-[8px] border border-[var(--line-soft)]">
            {ORG_FEATURE_OPTIONS.map((option) => {
              const enabled = customizations.features[option.key];
              return (
                <li
                  key={option.key}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-semibold text-[var(--ink)]">
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[var(--ink-soft)]">
                      {option.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`${option.label}: ${enabled ? "On" : "Off"}`}
                    disabled={!canManage}
                    onClick={() => customizations.onToggle(option.key)}
                    className={[
                      "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors",
                      "focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--green-tint)]",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      enabled
                        ? "border-[var(--green)] bg-[var(--green)]"
                        : "border-[var(--line)] bg-[var(--paper)]",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className={[
                        "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--surface)] shadow-sm transition-transform",
                        enabled ? "left-[1.35rem]" : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {customizations.formError ? (
            <p className="text-[14px] text-[var(--ink)]" role="alert">
              {customizations.formError}
            </p>
          ) : null}

          {canManage ? (
            <div>
              <Button
                onClick={customizations.onSave}
                disabled={!customizations.hasChanges || customizations.saving}
              >
                {customizations.saving ? "Saving…" : "Save customizations"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
