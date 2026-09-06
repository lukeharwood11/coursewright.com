/** P1 placeholder shown on org settings for owners. Stripe later. */
export function BillingPlaceholder() {
  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Billing</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        Course Wright bills the organization. Plan and payment settings will
        live here. Only owners can manage billing — admins can run the org, but
        they can’t change payment.
      </p>
    </section>
  );
}
