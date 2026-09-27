import { OrgSettingsSectionTitle } from "@/organizations/org-settings/components/OrgSettingsSectionTitle";

/** P1 placeholder shown on org settings for owners. Stripe later. */
export function BillingPlaceholder() {
  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <OrgSettingsSectionTitle tab="billing" />
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        You’re on the Free plan.
      </p>
    </section>
  );
}
