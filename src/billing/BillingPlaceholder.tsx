/** P1 placeholder shown on org settings for owners. Stripe later. */
export function BillingPlaceholder() {
  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">Billing</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        You’re on the Free plan.
      </p>
    </section>
  );
}
